import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { guestLimits } from '../catalog';
import { calculateEstimate, lookupPrice, type EstimateInput } from './engine';
import { priceTableV2 as table } from './table.v2';

const reference: EstimateInput = {
  eventType: 'wedding',
  guests: 50,
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: ['dj'],
  decorations: ['flowers'],
};

const estimate = (input: Partial<EstimateInput> = {}, config = business) =>
  calculateEstimate({ ...reference, ...input }, table, config);

describe('calculateEstimate', () => {
  it('matches the reference case', () => {
    const result = estimate();
    expect(result.kind).toBe('priced');
    expect(result.guests).toBe(50);
    expect(result.totalLow).toBe(450_000);
    expect(result.totalHigh).toBe(725_000);
    expect(result.midpoint).toBe(587_500);
    expect(result.depositAmount).toBe(117_500);
    expect(result.depositPercent).toBe(20);
    expect(result.currency).toBe('GBP');
    expect(result.pricingVersion).toBe('pricing-v2');
  });

  it('keeps per-person lines in pence', () => {
    expect(estimate().lines).toEqual([
      {
        category: 'food',
        item: 'dinner',
        lowPerPerson: 5000,
        highPerPerson: 8500,
      },
      {
        category: 'drinks',
        item: 'wine-only',
        lowPerPerson: 1400,
        highPerPerson: 2500,
      },
      {
        category: 'entertainment',
        item: 'dj',
        lowPerPerson: 1100,
        highPerPerson: 2000,
      },
      {
        category: 'decorations',
        item: 'flowers',
        lowPerPerson: 1500,
        highPerPerson: 1500,
      },
    ]);
  });

  it('sums several items in one category', () => {
    const result = estimate({ food: ['dinner', 'canapes'] });
    expect(result.lines.filter((line) => line.category === 'food')).toHaveLength(2);
    expect(result.totalLow).toBe((90 + 20) * 100 * 50);
    expect(result.totalHigh).toBe((145 + 35) * 100 * 50);
  });

  it.each([guestLimits.min, 37, guestLimits.max])('multiplies by exactly %i guests', (guests) => {
    const result = estimate({ guests });
    expect(result.guests).toBe(guests);
    expect(result.totalLow).toBe(90 * 100 * guests);
    expect(result.totalHigh).toBe(145 * 100 * guests);
  });

  it('charges £15 per person for Flowers and for Balloons', () => {
    const result = estimate({ decorations: ['flowers', 'balloons'] });
    expect(result.totalLow).toBe((90 + 15) * 100 * 50);
    expect(result.totalHigh).toBe((145 + 15) * 100 * 50);
  });

  it('prices Brunch like Lunch', () => {
    expect(estimate({ food: ['brunch'] }).totalLow).toBe(estimate({ food: ['lunch'] }).totalLow);
  });

  it('leaves own food out of the estimate without making it on request', () => {
    const result = estimate({ food: ['dinner', 'own-food'] });
    expect(result).toEqual(estimate());
  });

  it('ignores skipped categories', () => {
    const result = estimate({ entertainment: [], decorations: [] });
    expect(result.kind).toBe('priced');
    expect(result.lines).toHaveLength(2);
    expect(result.totalLow).toBe((50 + 14) * 100 * 50);
  });

  it('leaves on-request items out of a partial estimate and bases the deposit on the rest', () => {
    const result = estimate({ decorations: ['flowers', 'other-bespoke'] });
    const priced = estimate();
    expect(result.kind).toBe('partial');
    expect(result.onRequestItems).toEqual([{ category: 'decorations', item: 'other-bespoke' }]);
    expect(result.midpoint).toBe(priced.midpoint);
    expect(result.depositAmount).toBe(priced.depositAmount);
  });

  it('prices only Flowers for an Other/Bespoke event', () => {
    const result = estimate({ eventType: 'other-bespoke' });
    expect(result.kind).toBe('partial');
    expect(result.lines).toEqual([
      {
        category: 'decorations',
        item: 'flowers',
        lowPerPerson: 1500,
        highPerPerson: 1500,
      },
    ]);
    expect(result.onRequestItems).toHaveLength(3);
  });

  it('gives no amounts for an Other/Bespoke event without Flowers or Balloons', () => {
    const result = estimate({ eventType: 'other-bespoke', decorations: [] });
    expect(result.kind).toBe('on-request');
    expect(result.lines).toEqual([]);
    expect(result.totalLow).toBeNull();
    expect(result.totalHigh).toBeNull();
    expect(result.midpoint).toBeNull();
    expect(result.depositAmount).toBeNull();
  });

  it('gives no amounts when nothing is selected', () => {
    const result = estimate({
      food: [],
      drinks: [],
      entertainment: [],
      decorations: [],
    });
    expect(result.kind).toBe('on-request');
    expect(result.onRequestItems).toEqual([]);
    expect(result.depositAmount).toBeNull();
  });

  it('rounds the deposit to a whole pence', () => {
    const result = estimate({}, {
      ...business,
      depositPercent: 12.345,
    } as never);
    expect(result.depositAmount).toBe(Math.round((587_500 * 12.345) / 100));
    expect(Number.isInteger(result.depositAmount)).toBe(true);
  });

  it('always returns whole pence for every event and number of guests', () => {
    for (const eventType of table.columns) {
      for (let guests = guestLimits.min; guests <= guestLimits.max; guests += 1) {
        const result = estimate({ eventType, guests });
        for (const value of [result.totalLow, result.totalHigh, result.midpoint]) {
          expect(value === null || Number.isInteger(value)).toBe(true);
        }
      }
    }
  });

  it('does not change with date, budget or free text', () => {
    const noisy = {
      ...reference,
      date: '2027-05-14',
      budget: 100_000,
      additionalInfo: 'Anything',
    };
    expect(calculateEstimate(noisy, table, business)).toEqual(estimate());
  });
});

describe('lookupPrice', () => {
  it('returns null for on-request cells', () => {
    expect(lookupPrice(table, 'wedding', 'decorations', 'other-bespoke')).toBeNull();
  });

  it('rejects an unknown item', () => {
    expect(() => lookupPrice(table, 'wedding', 'food', 'pizza')).toThrow('Unknown food item');
  });
});
