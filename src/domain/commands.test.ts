import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import {
  CommandNotAllowedError,
  applyCommand,
  createEstimatedRequest,
  isRequestCommand,
  type PricingContext,
  type RequestCommand,
} from './commands';
import { priceTableV1 } from './pricing/table.v1';
import type { EventDetails, EventRequest, RequestStatus } from './request';
import { isCompleteEvent } from './validation';

const pricing: PricingContext = { table: priceTableV1, config: business };
const T0 = '2026-11-01T10:00:00.000Z';
const T1 = '2026-11-01T10:05:00.000Z';

const event: EventDetails = {
  type: 'wedding',
  typeNote: null,
  date: '2027-05-14',
  startTime: '18:30',
  endTime: '01:00',
  endsNextDay: true,
  partySize: 'size-40-60',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: { items: ['dj'], activitiesPreference: null },
  decorations: { items: ['flowers'], note: null },
  additionalInfo: '',
  budget: '2500-5000',
};

const contact = {
  firstName: 'Jamie',
  lastName: 'Doe',
  email: 'jamie@example.com',
  phone: '07700900000',
};

const estimated = (eventDetails = event) =>
  createEstimatedRequest({ id: 'id', accountId: null, contact, event: eventDetails }, pricing, T0);

const run = (request: EventRequest, ...commands: RequestCommand[]) =>
  commands.reduce((current, command) => applyCommand(current, command, pricing, T1), request);

const inStatus = (status: RequestStatus): EventRequest => ({ ...estimated(), status });

describe('createEstimatedRequest', () => {
  it('calculates the estimate itself and starts at estimated', () => {
    const request = estimated();
    expect(request.status).toBe('estimated');
    expect(request.estimate?.midpoint).toBe(618_000);
    expect(request.estimate?.depositAmount).toBe(123_600);
    expect(request.statusHistory.map((change) => change.status)).toEqual(['draft', 'estimated']);
  });
});

describe('applyCommand', () => {
  it('reaches deposit-pending through the full path', () => {
    const request = run(
      estimated(),
      { type: 'accept-estimate' },
      { type: 'request-consultation' },
      { type: 'set-consultation-method', method: 'phone' },
      { type: 'proceed' },
    );
    expect(request.status).toBe('deposit-pending');
    expect(request.decisions).toEqual({
      estimateAccepted: true,
      consultationWanted: true,
      proceed: true,
      declinedAt: null,
    });
    expect(request.consultation.method).toBe('phone');
  });

  it('keeps going when the consultation is skipped', () => {
    const request = run(
      estimated(),
      { type: 'accept-estimate' },
      { type: 'skip-consultation' },
      { type: 'proceed' },
    );
    expect(request.status).toBe('deposit-pending');
    expect(request.decisions.consultationWanted).toBe(false);
  });

  it('sends a rejected estimate to revising, not to declined', () => {
    const request = run(estimated(), { type: 'reject-estimate' });
    expect(request.status).toBe('revising');
    expect(request.decisions.estimateAccepted).toBe(false);
  });

  it('recalculates and resets decisions when the event changes', () => {
    const cheaper = { ...event, food: ['lunch' as const] };
    const request = run(
      estimated(),
      { type: 'reject-estimate' },
      { type: 'change-event', event: cheaper },
    );
    expect(request.status).toBe('estimated');
    expect(request.estimate?.midpoint).toBe(473_000);
    expect(request.decisions.estimateAccepted).toBeNull();
    expect(request.estimateHistory).toEqual([
      { at: T1, totalLow: 336_000, totalHigh: 900_000, midpoint: 618_000 },
    ]);
  });

  it.each([
    ['revising', 'estimate'],
    ['accepted', 'proceed'],
    ['consultation-requested', 'proceed'],
    ['deposit-pending', 'deposit'],
  ] as const)('records where a request from %s was declined', (status, stage) => {
    const request = run(inStatus(status), { type: 'decline' });
    expect(request.status).toBe('declined');
    expect(request.decisions.declinedAt).toBe(stage);
  });

  it('keeps a fully on-request event out of the deposit', () => {
    const bespoke = estimated({ ...event, type: 'other-bespoke' });
    const request = run(bespoke, { type: 'accept-estimate' }, { type: 'proceed' });
    expect(request.status).toBe('accepted');
    expect(request.decisions.proceed).toBe(true);
    expect(request.estimate?.depositAmount).toBeNull();
  });

  it('bumps the revision on commands that keep the status', () => {
    const accepted = run(estimated(), { type: 'accept-estimate' });
    const skipped = run(accepted, { type: 'skip-consultation' });
    expect(skipped.revision).toBe(accepted.revision + 1);
    expect(skipped.updatedAt).toBe(T1);
  });

  it.each([
    ['accept-estimate', 'accepted'],
    ['reject-estimate', 'accepted'],
    ['request-consultation', 'estimated'],
    ['skip-consultation', 'estimated'],
    ['proceed', 'estimated'],
    ['decline', 'estimated'],
    ['decline', 'declined'],
    ['decline', 'deposit-paid'],
  ] as const)('rejects %s from %s', (type, status) => {
    expect(() => run(inStatus(status), { type })).toThrow(CommandNotAllowedError);
  });

  it.each(['declined', 'deposit-paid'] as const)('rejects changing a %s event', (status) => {
    expect(() => run(inStatus(status), { type: 'change-event', event })).toThrow();
  });

  it('does not mutate the original request', () => {
    const request = estimated();
    const before = structuredClone(request);
    run(request, { type: 'accept-estimate' });
    expect(request).toEqual(before);
  });
});

describe('isRequestCommand', () => {
  it('accepts valid commands', () => {
    expect(isRequestCommand({ type: 'proceed' }, isCompleteEvent)).toBe(true);
    expect(
      isRequestCommand({ type: 'set-consultation-method', method: 'email' }, isCompleteEvent),
    ).toBe(true);
    expect(isRequestCommand({ type: 'change-event', event }, isCompleteEvent)).toBe(true);
  });

  it.each([
    [null],
    ['proceed'],
    [{ type: 'pay-nothing' }],
    [{ type: 'set-consultation-method', method: 'fax' }],
    [{ type: 'change-event', event: { ...event, food: [] } }],
  ])('rejects %j', (command) => {
    expect(isRequestCommand(command, isCompleteEvent)).toBe(false);
  });
});
