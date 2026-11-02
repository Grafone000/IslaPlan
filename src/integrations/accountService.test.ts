import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { createDraft, type EventRequest, type RequestStatus } from '@/domain/request';
import { loadAccountEvent, type AccountServiceDeps } from './accountService';
import type { AttachmentStore, MessageRepository, PhotoRepository } from './contracts';

const ID = 'request-1';

const request = (accountId: string | null, status: RequestStatus = 'deposit-paid'): EventRequest => ({
  ...createDraft(ID, '2026-01-01T00:00:00.000Z'),
  accountId,
  status,
});

let stored: EventRequest | null;
let photoList: Mock<PhotoRepository['list']>;
let messageList: Mock<MessageRepository['list']>;
let signedUrl: Mock<AttachmentStore['signedUrl']>;
let deps: AccountServiceDeps;

beforeEach(() => {
  stored = request('account-1');
  photoList = vi.fn<PhotoRepository['list']>(async () => [
    { name: 'a.jpg', url: 'https://signed/a.jpg' },
  ]);
  messageList = vi.fn<MessageRepository['list']>(async () => [
    {
      id: 'message-1',
      requestId: ID,
      direction: 'client',
      subject: 'Hello',
      body: { type: 'doc' },
      bodyText: 'Hello',
      attachments: [{ name: 'plan.txt', type: 'text/plain', size: 4, storagePath: 'x/plan.txt' }],
      createdAt: 'now',
    },
  ]);
  signedUrl = vi.fn<AttachmentStore['signedUrl']>(async (path) => `https://signed/${path}`);
  deps = {
    requests: { get: async () => stored } as unknown as AccountServiceDeps['requests'],
    messages: { list: messageList, add: vi.fn() },
    photos: { list: photoList },
    attachments: { upload: vi.fn(), signedUrl },
  };
});

describe('loadAccountEvent', () => {
  it('returns the event with photos and signed attachment links', async () => {
    const page = await loadAccountEvent(ID, 'account-1', deps);
    expect(page?.photos).toHaveLength(1);
    expect(page?.messages[0].attachments).toEqual([
      { name: 'plan.txt', url: 'https://signed/x/plan.txt' },
    ]);
  });

  it.each([
    ['another account', () => request('account-2')],
    ['a guest request', () => request(null)],
    ['a declined request', () => request('account-1', 'declined')],
    ['a missing request', () => null],
  ])('reads nothing for %s', async (_name, make) => {
    stored = make();
    expect(await loadAccountEvent(ID, 'account-1', deps)).toBeNull();
    expect(photoList).not.toHaveBeenCalled();
    expect(messageList).not.toHaveBeenCalled();
    expect(signedUrl).not.toHaveBeenCalled();
  });
});
