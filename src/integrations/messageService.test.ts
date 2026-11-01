import { beforeEach, describe, expect, it, vi } from 'vitest';
import { business } from '@/config/business';
import { createEstimatedRequest } from '@/domain/commands';
import { priceTableV1 } from '@/domain/pricing/table.v1';
import type { EventDetails, EventRequest } from '@/domain/request';
import type { EmailMessage, EventMessage, RequestRepository } from './contracts';
import { MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES, postMessage, type MessageServiceDeps } from './messageService';

const ID = '6f1c1f0e-2f43-4f52-9d0e-3f8a0a7f1b11';
const contact = {
  firstName: 'Jamie',
  lastName: 'Doe',
  email: 'jamie@example.com',
  phone: '07700900000',
};
const event: EventDetails = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  partySize: 'size-40-60',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: { items: [], activitiesPreference: null },
  decorations: { items: [], note: null },
  additionalInfo: '',
  budget: '2500-5000',
};
const body = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello there' }] }],
};
const input = { subject: 'My event', body };

let stored: EventRequest;
let saved: EventMessage[];
let sent: EmailMessage[];
let uploaded: string[];
let deps: MessageServiceDeps;

function setup(status: EventRequest['status'], accountId: string | null) {
  const base = createEstimatedRequest(
    { id: ID, accountId, contact, event },
    { table: priceTableV1, config: business },
    '2026-11-01T10:00:00.000Z',
  );
  stored = { ...base, status };
}

beforeEach(() => {
  saved = [];
  sent = [];
  uploaded = [];
  setup('consultation-requested', null);
  const requests = {
    get: vi.fn(async () => stored),
    update: vi.fn(async (request: EventRequest) => {
      stored = request;
      return true;
    }),
  } as unknown as RequestRepository;
  deps = {
    requests,
    messages: {
      list: async () => [],
      add: async (message) => {
        const row = { ...message, createdAt: 'now' };
        saved.push(row);
        return row;
      },
    },
    attachments: {
      upload: async (path) => {
        uploaded.push(path);
      },
      signedUrl: async (path) => path,
    },
    email: {
      sendEmail: async (message) => {
        sent.push(message);
        return { messageId: 'email-1' };
      },
    },
    organiserEmail: 'organiser@example.com',
    now: () => '2026-11-01T11:00:00.000Z',
    newId: () => 'message-1',
  };
});

const file = (name: string, size = 10) => new File(['x'.repeat(size)], name, { type: 'text/plain' });

describe('postMessage', () => {
  it('stores the message, sends it and links it to the consultation', async () => {
    const result = await postMessage(ID, input, [], null, deps);
    expect(result.status).toBe(201);
    expect(saved[0]).toMatchObject({
      requestId: ID,
      direction: 'client',
      subject: 'My event',
      bodyText: 'Hello there',
    });
    expect(sent[0]).toEqual({
      to: 'organiser@example.com',
      from: 'jamie@example.com',
      subject: 'My event',
      bodyText: 'Hello there',
    });
    expect(stored.consultation).toEqual({ method: 'email', messageId: 'message-1' });
  });

  it('always sends to the organiser, whatever the browser asks', async () => {
    const hostile = { ...input, to: 'someone-else@example.com' };
    await postMessage(ID, hostile, [], null, deps);
    expect(sent[0].to).toBe('organiser@example.com');
  });

  it('stores attachments under the request and message, with a safe name', async () => {
    await postMessage(ID, input, [file('../../My Plan (final).txt')], null, deps);
    expect(uploaded).toEqual([`${ID}/message-1/0-_.._My_Plan_final_.txt`.replace('_.._', '_.._')]);
    expect(saved[0].attachments[0]).toMatchObject({
      name: '../../My Plan (final).txt',
      size: 10,
      type: 'text/plain',
    });
  });

  it.each([
    ['no subject', { subject: '  ', body }],
    ['a subject too long', { subject: 'x'.repeat(201), body }],
    ['a subject that is not text', { subject: 1, body }],
    ['an empty body', { subject: 'Hi', body: { type: 'doc', content: [{ type: 'paragraph' }] } }],
    ['an unsafe body', { subject: 'Hi', body: { type: 'doc', content: [{ type: 'image' }] } }],
  ])('rejects %s', async (_name, invalid) => {
    expect((await postMessage(ID, invalid, [], null, deps)).status).toBe(400);
    expect(saved).toEqual([]);
    expect(sent).toEqual([]);
  });

  it('rejects an empty, oversized or excessive attachment before storing anything', async () => {
    const big = file('big.txt');
    Object.defineProperty(big, 'size', { value: MAX_ATTACHMENT_BYTES + 1 });
    const tooMany = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, i) => file(`${i}.txt`));

    for (const files of [[big], [file('empty.txt', 0)], tooMany]) {
      expect((await postMessage(ID, input, files, null, deps)).status).toBe(400);
    }
    expect(uploaded).toEqual([]);
  });

  it('hides a request from anyone but its account', async () => {
    setup('accepted', 'account-1');
    expect((await postMessage(ID, input, [], null, deps)).status).toBe(404);
    expect((await postMessage(ID, input, [], 'account-2', deps)).status).toBe(404);
    expect((await postMessage(ID, input, [], 'account-1', deps)).status).toBe(201);
  });

  it('lets a guest write only during the consultation', async () => {
    setup('estimated', null);
    expect((await postMessage(ID, input, [], null, deps)).status).toBe(409);
    expect(saved).toEqual([]);
  });

  it('rejects a bad id', async () => {
    expect((await postMessage('nope', input, [], null, deps)).status).toBe(400);
  });
});
