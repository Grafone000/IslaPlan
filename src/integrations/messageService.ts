import { recordConsultationMessage } from '@/domain/commands';
import { bodyToText, isMessageBody } from '@/domain/messageBody';
import { isUuid } from '@/domain/validation';
import type {
  AttachmentStore,
  EmailGateway,
  MessageAttachment,
  MessageRepository,
  RequestRepository,
} from './contracts';
import type { ServiceResult } from './requestService';

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
const MAX_SUBJECT_LENGTH = 200;

export interface MessageServiceDeps {
  requests: RequestRepository;
  messages: MessageRepository;
  attachments: AttachmentStore;
  email: EmailGateway;
  organiserEmail: string;
  now(): string;
  newId(): string;
}

const failure = (status: number, error: string): ServiceResult => ({ status, body: { error } });

const safeFileName = (name: string) =>
  name.replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(-100) || 'attachment';

// The recipient is always the organiser, whatever the browser sends: otherwise a real email
// provider would turn this endpoint into an open relay.
export async function postMessage(
  id: string,
  input: { subject: unknown; body: unknown },
  files: File[],
  accountId: string | null,
  deps: MessageServiceDeps,
): Promise<ServiceResult> {
  if (!isUuid(id)) {
    return failure(400, 'invalid-request');
  }
  const request = await deps.requests.get(id);
  if (!request || (request.accountId !== null && request.accountId !== accountId)) {
    return failure(404, 'not-found');
  }
  // Guests have no private area: they can only write during their consultation.
  if (request.accountId === null && request.status !== 'consultation-requested') {
    return failure(409, 'not-allowed');
  }

  const { subject, body } = input;
  if (
    typeof subject !== 'string' ||
    subject.trim() === '' ||
    subject.length > MAX_SUBJECT_LENGTH ||
    !isMessageBody(body) ||
    bodyToText(body).trim() === ''
  ) {
    return failure(400, 'invalid-message');
  }
  if (
    files.length > MAX_ATTACHMENTS ||
    files.some((file) => file.size === 0 || file.size > MAX_ATTACHMENT_BYTES)
  ) {
    return failure(400, 'invalid-attachment');
  }

  const messageId = deps.newId();
  const attachments: MessageAttachment[] = [];
  for (const [index, file] of files.entries()) {
    const storagePath = `${id}/${messageId}/${index}-${safeFileName(file.name)}`;
    await deps.attachments.upload(storagePath, file);
    attachments.push({ name: file.name, type: file.type, size: file.size, storagePath });
  }

  const bodyText = bodyToText(body);
  const message = await deps.messages.add({
    id: messageId,
    requestId: id,
    direction: 'client',
    subject: subject.trim(),
    body,
    bodyText,
    attachments,
  });

  await deps.email.sendEmail({
    to: deps.organiserEmail,
    from: request.contact?.email ?? '',
    subject: subject.trim(),
    bodyText,
  });

  if (request.status === 'consultation-requested') {
    const updated = recordConsultationMessage(request, messageId, deps.now());
    await deps.requests.update(updated, request.revision);
    return { status: 201, body: { message, request: updated } };
  }
  return { status: 201, body: { message, request } };
}
