import { beforeEach, describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { priceTableV1 } from '@/domain/pricing/table.v1';
import type { EventRequest } from '@/domain/request';
import type { CrmGateway, RequestRepository } from './contracts';
import { createRequest, runRequestCommand, type RequestServiceDeps } from './requestService';

const ID = '6f1c1f0e-2f43-4f52-9d0e-3f8a0a7f1b11';
const contact = {
  firstName: 'Jamie',
  lastName: 'Doe',
  email: 'jamie@example.com',
  phone: '07700900000',
};
const event = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '23:00',
  endsNextDay: false,
  partySize: 'size-40-60',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: { items: ['dj'], activitiesPreference: null },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: '2500-5000',
};

let stored: Map<string, EventRequest>;
let submitted: EventRequest[];
let deps: RequestServiceDeps;

function memoryRepository(): RequestRepository {
  return {
    async create(request) {
      stored.set(request.id, request);
    },
    async update(request, expectedRevision) {
      if (stored.get(request.id)?.revision !== expectedRevision) return false;
      stored.set(request.id, request);
      return true;
    },
    async get(id) {
      return stored.get(id) ?? null;
    },
    async listByAccount() {
      return [];
    },
    async linkGuestRequests() {},
  };
}

beforeEach(() => {
  stored = new Map();
  submitted = [];
  const crm: CrmGateway = {
    async submitRequest(request) {
      submitted.push(request);
      return { ok: true };
    },
  };
  deps = {
    requests: memoryRepository(),
    crm,
    pricing: { table: priceTableV1, config: business },
    now: () => '2026-11-01T10:00:00.000Z',
  };
});

const create = (accountId: string | null = null) =>
  createRequest({ id: ID, contact, event }, accountId, deps);

describe('createRequest', () => {
  it('stores the request and sends it to the CRM gateway', async () => {
    const result = await create();
    expect(result.status).toBe(201);
    expect(stored.get(ID)?.status).toBe('estimated');
    expect(submitted).toHaveLength(1);
  });

  it('ignores amounts, status and account sent by the browser', async () => {
    const tampered = {
      id: ID,
      contact,
      event,
      status: 'deposit-paid',
      accountId: 'someone-else',
      estimate: { midpoint: 1, depositAmount: 1 },
    };
    await createRequest(tampered, null, deps);
    const request = stored.get(ID);
    expect(request?.status).toBe('estimated');
    expect(request?.accountId).toBeNull();
    expect(request?.estimate?.depositAmount).toBe(123_600);
  });

  it('takes the account from the session', async () => {
    await create('account-1');
    expect(stored.get(ID)?.accountId).toBe('account-1');
  });

  it.each([
    ['a bad id', { id: 'nope', contact, event }],
    ['a bad contact', { id: ID, contact: { ...contact, email: 'x' }, event }],
    ['an unfinished event', { id: ID, contact, event: { ...event, food: [] } }],
    ['an empty body', null],
  ])('rejects %s', async (_name, body) => {
    expect((await createRequest(body, null, deps)).status).toBe(400);
    expect(stored.size).toBe(0);
  });

  it('refuses a duplicate id', async () => {
    await create();
    expect((await create()).status).toBe(409);
    expect(submitted).toHaveLength(1);
  });
});

describe('runRequestCommand', () => {
  it('applies a command and sends the update', async () => {
    await create();
    const result = await runRequestCommand(ID, { type: 'accept-estimate' }, null, deps);
    expect(result.status).toBe(200);
    expect(stored.get(ID)?.status).toBe('accepted');
    expect(submitted).toHaveLength(2);
  });

  it('rejects a command that the status does not allow', async () => {
    await create();
    expect((await runRequestCommand(ID, { type: 'proceed' }, null, deps)).status).toBe(409);
    expect(stored.get(ID)?.status).toBe('estimated');
  });

  it('rejects an unknown command', async () => {
    await create();
    const result = await runRequestCommand(ID, { type: 'mark-paid' }, null, deps);
    expect(result.status).toBe(400);
  });

  it('answers 404 for a missing request and 400 for a bad id', async () => {
    expect((await runRequestCommand(ID, { type: 'proceed' }, null, deps)).status).toBe(404);
    expect((await runRequestCommand('x', { type: 'proceed' }, null, deps)).status).toBe(400);
  });

  it('hides a request from anyone but its account', async () => {
    await create('account-1');
    const command = { type: 'accept-estimate' };
    expect((await runRequestCommand(ID, command, null, deps)).status).toBe(404);
    expect((await runRequestCommand(ID, command, 'account-2', deps)).status).toBe(404);
    expect((await runRequestCommand(ID, command, 'account-1', deps)).status).toBe(200);
  });

  it('detects a concurrent change', async () => {
    await create();
    deps.requests.update = async () => false;
    const result = await runRequestCommand(ID, { type: 'accept-estimate' }, null, deps);
    expect(result.status).toBe(409);
    expect(submitted).toHaveLength(1);
  });
});
