import { recordDepositPayment, recordPaymentOutcome } from '@/domain/commands';
import { isUuid } from '@/domain/validation';
import type { PaymentGateway, PaymentOutcome, RequestRepository } from './contracts';
import type { ServiceResult } from './requestService';

export interface PaymentServiceDeps {
  requests: RequestRepository;
  payments: PaymentGateway;
  now(): string;
}

const failure = (status: number, error: string): ServiceResult => ({ status, body: { error } });

async function payableRequest(id: string, accountId: string | null, deps: PaymentServiceDeps) {
  if (!isUuid(id)) {
    return { error: failure(400, 'invalid-request') };
  }
  const request = await deps.requests.get(id);
  if (!request || (request.accountId !== null && request.accountId !== accountId)) {
    return { error: failure(404, 'not-found') };
  }
  if (request.status !== 'deposit-pending') {
    return { error: failure(409, 'not-allowed') };
  }
  return { request };
}

export async function startDeposit(
  id: string,
  accountId: string | null,
  deps: PaymentServiceDeps,
): Promise<ServiceResult> {
  const { request, error } = await payableRequest(id, accountId, deps);
  if (!request) {
    return error;
  }
  // Reloading the page or retrying a card reuses the same payment.
  if (request.payment) {
    return { status: 200, body: { request } };
  }
  const amount = request.estimate?.depositAmount;
  if (!amount) {
    return failure(409, 'no-deposit');
  }

  const payment = await deps.payments.createDepositPayment({
    requestId: id,
    amount,
    currency: request.estimate?.currency ?? '',
  });
  const updated = recordDepositPayment(
    request,
    { ...payment, provider: deps.payments.provider },
    deps.now(),
  );
  if (!(await deps.requests.update(updated, request.revision))) {
    return failure(409, 'stale-request');
  }
  return { status: 200, body: { request: updated } };
}

export async function confirmDeposit(
  id: string,
  body: unknown,
  accountId: string | null,
  deps: PaymentServiceDeps,
): Promise<ServiceResult> {
  const { paymentId, reported } = (body ?? {}) as Record<string, unknown>;
  if (reported !== 'paid' && reported !== 'failed') {
    return failure(400, 'invalid-payment');
  }
  const { request, error } = await payableRequest(id, accountId, deps);
  if (!request) {
    return error;
  }
  if (!request.payment || request.payment.paymentId !== paymentId) {
    return failure(409, 'unknown-payment');
  }

  const outcome: PaymentOutcome = await deps.payments.verifyPayment(request.payment.paymentId, reported);
  const updated = recordPaymentOutcome(request, outcome, deps.now());
  if (!(await deps.requests.update(updated, request.revision))) {
    return failure(409, 'stale-request');
  }
  return { status: 200, body: { request: updated } };
}
