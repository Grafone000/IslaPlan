import {
  CommandNotAllowedError,
  applyCommand,
  createEstimatedRequest,
  isRequestCommand,
  type PricingContext,
} from '@/domain/commands';
import { InvalidTransitionError } from '@/domain/request';
import { isCompleteEvent, isContact, isUuid } from '@/domain/validation';
import type { CrmGateway, RequestRepository } from './contracts';

export interface RequestServiceDeps {
  requests: RequestRepository;
  crm: CrmGateway;
  pricing: PricingContext;
  now(): string;
}

export interface ServiceResult {
  status: number;
  body: unknown;
}

const failure = (status: number, error: string): ServiceResult => ({ status, body: { error } });

// Anything in the body beyond id, contact and event is ignored: the browser cannot set
// amounts, statuses or the account.
export async function createRequest(
  body: unknown,
  accountId: string | null,
  deps: RequestServiceDeps,
): Promise<ServiceResult> {
  const { id, contact, event } = (body ?? {}) as Record<string, unknown>;
  if (!isUuid(id) || !isContact(contact) || !isCompleteEvent(event)) {
    return failure(400, 'invalid-request');
  }
  if (await deps.requests.get(id)) {
    return failure(409, 'already-exists');
  }

  const request = createEstimatedRequest(
    { id, accountId, contact, event },
    deps.pricing,
    deps.now(),
  );
  await deps.requests.create(request);
  await deps.crm.submitRequest(request);
  return { status: 201, body: { request } };
}

export async function runRequestCommand(
  id: string,
  body: unknown,
  accountId: string | null,
  deps: RequestServiceDeps,
): Promise<ServiceResult> {
  if (!isUuid(id)) {
    return failure(400, 'invalid-request');
  }
  const request = await deps.requests.get(id);
  // A request tied to an account answers as missing to anyone else. A guest request is
  // reachable only by its unguessable id.
  if (!request || (request.accountId !== null && request.accountId !== accountId)) {
    return failure(404, 'not-found');
  }
  if (!isRequestCommand(body, isCompleteEvent)) {
    return failure(400, 'invalid-command');
  }

  try {
    const updated = applyCommand(request, body, deps.pricing, deps.now());
    if (!(await deps.requests.update(updated, request.revision))) {
      return failure(409, 'stale-request');
    }
    await deps.crm.submitRequest(updated);
    return { status: 200, body: { request: updated } };
  } catch (error) {
    if (error instanceof CommandNotAllowedError || error instanceof InvalidTransitionError) {
      return failure(409, 'command-not-allowed');
    }
    throw error;
  }
}
