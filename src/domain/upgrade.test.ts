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

const v2Request = {
  ...createDraft('id', T0),
  schemaVersion: 2,
  status: 'estimated',
  event: {
    ...v1Request.event,
    partySize: undefined,
    guests: 50,
    food: { items: ['lunch'], menus: { lunch: 'copper-fork' }, ownFoodNote: null },
    drinks: {
      items: ['cocktails-masterclass', 'cocktails-spirits-only', 'drinks-all', 'wine-only'],
      packages: {
        'cocktails-spirits-only': 'two-cocktails-or-half-bottle',
        'drinks-all': 'four-cocktails',
        'wine-only': 'wine-175ml',
      },
      times: {},
      ownDrinksNote: null,
    },
    entertainment: { items: [], times: {}, activitiesPreference: null },
    budget: 500_000,
  },
  estimate: { ...v1Request.estimate, guestsMin: undefined, guestsMax: undefined, guests: 50 },
};

describe('upgradeRequest', () => {
  it('reads a schema 1 request as schema 3', () => {
    const request = upgradeRequest(v1Request);
    expect(request.schemaVersion).toBe(3);
    expect(request.event.partySize).toBe('size-40-60');
    expect(request.event.budget).toBe(2_000_000);
    expect(request.event.food).toEqual({ items: ['dinner'], menus: {}, ownFoodNote: null });
    expect(request.event.drinks).toEqual({
      items: ['wine-only'],
      packages: {},
      drinksAllBottle: null,
      wineBottles: [],
      times: {},
      ownDrinksNote: null,
    });
    expect(request.event.entertainment).toEqual({
      items: ['dj'],
      times: {},
      activitiesPreference: null,
    });
  });

  it('keeps schema 1 amounts and adds empty bottle lines', () => {
    const { estimate } = upgradeRequest(v1Request);
    expect(estimate).toMatchObject({ guestsMin: 40, guestsMax: 60, midpoint: 618_000 });
    expect(estimate?.bottleLines).toEqual([]);
  });

  it('reads a schema 2 request as schema 3', () => {
    const request = upgradeRequest(v2Request);
    expect(request.event.partySize).toBe('size-40-60');
    expect(request.event).not.toHaveProperty('guests');
    expect(request.event.food.menus).toEqual({ lunch: 'copper-fork' });
    // The masterclass is gone; cocktail counts carry over; wine sizes need bottles now.
    expect(request.event.drinks.items).toEqual(['cocktails-spirits-only', 'drinks-all', 'wine-only']);
    expect(request.event.drinks.packages).toEqual({
      'cocktails-spirits-only': 'two-cocktails',
      'drinks-all': 'four-cocktails-bottle',
    });
    expect(request.estimate).toMatchObject({ guestsMin: 50, guestsMax: 50 });
    expect(request.estimate).not.toHaveProperty('guests');
  });

  it('leaves a current request untouched', () => {
    const current = createDraft('id', T0);
    expect(upgradeRequest(current)).toBe(current);
  });
});
