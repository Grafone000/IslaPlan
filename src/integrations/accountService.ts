import type { EventRequest } from '@/domain/request';
import type {
  AttachmentStore,
  EventMessage,
  EventPhoto,
  MessageRepository,
  PhotoRepository,
  RequestRepository,
} from './contracts';

export interface AccountServiceDeps {
  requests: RequestRepository;
  messages: MessageRepository;
  photos: PhotoRepository;
  attachments: AttachmentStore;
}

export interface LinkedAttachment {
  name: string;
  url: string;
}

export interface ThreadMessage extends Omit<EventMessage, 'attachments'> {
  attachments: LinkedAttachment[];
}

export interface AccountEventPage {
  request: EventRequest;
  photos: EventPhoto[];
  messages: ThreadMessage[];
}

// Nothing is read for a request until it is confirmed to belong to this account. A declined
// request answers as missing, like in the events list.
export async function loadAccountEvent(
  id: string,
  accountId: string,
  deps: AccountServiceDeps,
): Promise<AccountEventPage | null> {
  const request = await deps.requests.get(id);
  if (!request || request.accountId !== accountId || request.status === 'declined') {
    return null;
  }

  const [photos, stored] = await Promise.all([
    deps.photos.list(id),
    deps.messages.list(id),
  ]);

  const messages = await Promise.all(
    stored.map(async (message) => ({
      ...message,
      attachments: await Promise.all(
        message.attachments.map(async (file) => ({
          name: file.name,
          url: await deps.attachments.signedUrl(file.storagePath),
        })),
      ),
    })),
  );

  return { request, photos, messages };
}
