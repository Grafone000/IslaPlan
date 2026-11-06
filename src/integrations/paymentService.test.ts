import { beforeEach, describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { applyCommand, createEstimatedRequest, type PricingContext } from '@/domain/commands';
import { priceTableV3 } from '@/domain/pricing/table.v3';
import { transition, type EventDetails, type EventRequest } from '@/domain/request';
import type { RequestRepository } from './contracts';
import { confirmDeposit, startDeposit, type PaymentServiceDeps } from './paymentService';

const ID = '6f1c1f0e-2f43-4f52-9d0e-3f8a0a7f1b11';
const NOW = '2026-11-01T11:00:00.000Z';
const pricing: PricingContext = { table: priceTableV3, config: business };
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
  food: { items: ['dinner'], menus: {}, ownFoodNote: null },
  drinks: {
    items: ['wine-only'],
    packages: {},
    drinksAllBottle: null,
    wineBottles: [{ product: 'house-red', glass: 'glass-150', quantity: 10 }],
    times: {},
    ownDrinksNote: null,
  },
  entertainment: {
    items: ['dj'],
    times: {
      dj: { startTime: '18:30', startsNextDay: false, endTime: '23:00', endsNextDay: false },
    },
    activitiesPreference: null,
  },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: 500_000,
};

let stored: EventRequest;
let created: number;
let verifiedAs: 'paid' | 'failed' | null;
let deps: PaymentServiceDeps;

// Clients are no longer asked for a deposit, but requests saved before still wait for one.
function atDeposit(accountId: string | null = null): EventRequest {
  const steps = [{ type: 'accept-estimate' }, { type: 'skip-consultation' }] as const;
  const accepted = steps.reduce(
    (request, command) => applyCommand(request, command, pricing, NOW),
    createEstimatedRequest({ id: ID, accountId, contact, event }, pricing, NOW),
  );
  return transition(accepted, 'deposit-pending', NOW);
}

beforeEach(() => {
  stored = atDeposit();
  created = 0;
  verifiedAs = null;
  const requests = {
    get: async () => stored,
    update: async (request: EventRequest, expected: number) => {
      if (stored.revision !== expected) return false;
      stored = request;
      return true;
    },
  } as unknown as RequestRepository;
  deps = {
    requests,
    payments: {
      provider: 'test',
      createDepositPayment: async ({ amount, currency }) => {
        created += 1;
        return { paymentId: 'pay-1', amount, currency };
      },
      verifyPayment: async (_id, reported) => verifiedAs ?? reported,
    },
    now: () => NOW,
  };
});

const paid = { paymentId: 'pay-1', reported: 'paid' };

describe('startDeposit', () => {
  it('creates the payment from the stored estimate', async () => {
    expect((await startDeposit(ID, null, deps)).status).toBe(200);
    expect(stored.payment).toEqual({
      provider: 'test',
      paymentId: 'pay-1',
      amount: 105_600,
      currency: 'GBP',
      status: 'pending',
      paidAt: null,
    });
  });

  it('reuses the payment on a reload', async () => {
    await startDeposit(ID, null, deps);
    await startDeposit(ID, null, deps);
    expect(created).toBe(1);
  });

  it('refuses a request that has not reached the deposit', async () => {
    stored = { ...stored, status: 'accepted' };
    expect((await startDeposit(ID, null, deps)).status).toBe(409);
    expect(created).toBe(0);
  });

  it('refuses an estimate with no deposit', async () => {
    stored = { ...stored, estimate: { ...stored.estimate!, depositAmount: null } };
    expect((await startDeposit(ID, null, deps)).status).toBe(409);
  });

  it('hides a request from anyone but its account', async () => {
    stored = atDeposit('account-1');
    expect((await startDeposit(ID, 'account-2', deps)).status).toBe(404);
    expect((await startDeposit(ID, null, deps)).status).toBe(404);
    expect((await startDeposit(ID, 'account-1', deps)).status).toBe(200);
  });

  it('rejects a bad id', async () => {
    expect((await startDeposit('nope', null, deps)).status).toBe(400);
  });
});

describe('confirmDeposit', () => {
  beforeEach(async () => {
    await startDeposit(ID, null, deps);
  });

  it('marks the deposit as paid', async () => {
    expect((await confirmDeposit(ID, paid, null, deps)).status).toBe(200);
    expect(stored.status).toBe('deposit-paid');
    expect(stored.payment?.status).toBe('paid');
    expect(stored.payment?.paidAt).toBe(NOW);
  });

  it('keeps the request open after a declined card so the client can retry', async () => {
    await confirmDeposit(ID, { paymentId: 'pay-1', reported: 'failed' }, null, deps);
    expect(stored.status).toBe('deposit-pending');
    expect(stored.payment?.status).toBe('failed');

    await confirmDeposit(ID, paid, null, deps);
    expect(stored.status).toBe('deposit-paid');
  });

  it('believes the gateway, not the browser', async () => {
    verifiedAs = 'failed';
    await confirmDeposit(ID, paid, null, deps);
    expect(stored.status).toBe('deposit-pending');
  });

  it('refuses a payment id it did not create', async () => {
    const result = await confirmDeposit(ID, { paymentId: 'other', reported: 'paid' }, null, deps);
    expect(result.status).toBe(409);
    expect(stored.status).toBe('deposit-pending');
  });

  it('cannot pay twice', async () => {
    await confirmDeposit(ID, paid, null, deps);
    expect((await confirmDeposit(ID, paid, null, deps)).status).toBe(409);
  });

  it.each([[null], [{}], [{ paymentId: 'pay-1', reported: 'maybe' }]])('rejects %j', async (body) => {
    expect((await confirmDeposit(ID, body, null, deps)).status).toBe(400);
  });
});
