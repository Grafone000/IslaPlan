import { describe, expect, it } from 'vitest';
import { createDraft } from './request';
import { upgradeRequest } from './upgrade';

const T0 = '2026-11-01T10:00:00.000Z';

const v1Request = {
  ...createDraft('id', T0),
  schemaVersion: 1,
  status: 'estimated',
  event: {
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
    budget: 'over-10000',
  },
  estimate: {
    kind: 'priced',
    pricingVersion: 'pricing-v1',
    currency: 'GBP',
    guestsMin: 40,
    guestsMax: 60,
    lines: [],
    onRequestItems: [],
    totalLow: 336_000,
    totalHigh: 900_000,
    midpoint: 618_000,
    depositPercent: 20,
    depositAmount: 123_600,
  },
};

describe('upgradeRequest', () => {
  it('reads a schema 1 request as schema 2', () => {
    const request = upgradeRequest(v1Request);
    expect(request.schemaVersion).toBe(2);
    expect(request.event.guests).toBe(60);
    expect(request.event.budget).toBe(2_000_000);
    expect(request.event.food).toEqual({ items: ['dinner'], menus: {}, ownFoodNote: null });
    expect(request.event.drinks).toEqual({
      items: ['wine-only'],
      packages: {},
      times: {},
      ownDrinksNote: null,
    });
    expect(request.event.entertainment).toEqual({
      items: ['dj'],
      times: {},
      activitiesPreference: null,
    });
    expect(request.event).not.toHaveProperty('partySize');
  });

  it('keeps the old amounts and drops the guest band', () => {
    const { estimate } = upgradeRequest(v1Request);
    expect(estimate).toMatchObject({ guests: 60, midpoint: 618_000, depositAmount: 123_600 });
    expect(estimate).not.toHaveProperty('guestsMin');
    expect(estimate).not.toHaveProperty('guestsMax');
  });

  it('leaves a current request untouched', () => {
    const current = createDraft('id', T0);
    expect(upgradeRequest(current)).toBe(current);
  });
});
