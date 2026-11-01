import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { partySizes } from '../catalog';
import { calculateEstimate, lookupPrice, type EstimateInput } from './engine';
import { priceTableV1 as table } from './table.v1';

const reference: EstimateInput = {
  eventType: 'wedding',
  partySize: 'size-40-60',
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
    expect(result.totalLow).toBe(336_000);
    expect(result.totalHigh).toBe(900_000);
    expect(result.midpoint).toBe(618_000);
    expect(result.depositAmount).toBe(123_600);
    expect(result.depositPercent).toBe(20);
    expect(result.currency).toBe('GBP');
    expect(result.pricingVersion).toBe('pricing-v1');
  });

  it('keeps per-person lines in pence', () => {
    expect(estimate().lines).toEqual([
      { category: 'food', item: 'dinner', lowPerPerson: 5000, highPerPerson: 8500 },
      { category: 'drinks', item: 'wine-only', lowPerPerson: 1400, highPerPerson: 2500 },
      { category: 'entertainment', item: 'dj', lowPerPerson: 1100, highPerPerson: 2000 },
      { category: 'decorations', item: 'flowers', lowPerPerson: 900, highPerPerson: 2000 },
    ]);
  });

  it('sums several items in one category', () => {
    const result = estimate({ food: ['dinner', 'canapes'] });
    expect(result.lines.filter((line) => line.category === 'food')).toHaveLength(2);
    expect(result.totalLow).toBe((84 + 20) * 100 * 40);
    expect(result.totalHigh).toBe((150 + 35) * 100 * 60);
  });

  it.each(partySizes.map((size) => [size.id, size.guestsMin, size.guestsMax] as const))(
    'uses the guest limits of %s',
    (partySize, guestsMin, guestsMax) => {
      const result = estimate({ partySize });
      expect(result.guestsMin).toBe(guestsMin);
      expect(result.guestsMax).toBe(guestsMax);
      expect(result.totalLow).toBe(84 * 100 * guestsMin);
      expect(result.totalHigh).toBe(150 * 100 * guestsMax);
    },
  );

  it('ignores skipped categories', () => {
    const result = estimate({ entertainment: [], decorations: [] });
    expect(result.kind).toBe('priced');
    expect(result.lines).toHaveLength(2);
    expect(result.totalLow).toBe((50 + 14) * 100 * 40);
  });

  it('leaves on-request items out of a partial estimate and bases the deposit on the rest', () => {
    const result = estimate({ decorations: ['flowers', 'other-bespoke'] });
    const priced = estimate();
    expect(result.kind).toBe('partial');
    expect(result.onRequestItems).toEqual([{ category: 'decorations', item: 'other-bespoke' }]);
    expect(result.midpoint).toBe(priced.midpoint);
    expect(result.depositAmount).toBe(priced.depositAmount);
  });

  it('gives no amounts for an Other/Bespoke event', () => {
    const result = estimate({ eventType: 'other-bespoke' });
    expect(result.kind).toBe('on-request');
    expect(result.lines).toEqual([]);
    expect(result.onRequestItems).toHaveLength(4);
    expect(result.totalLow).toBeNull();
    expect(result.totalHigh).toBeNull();
    expect(result.midpoint).toBeNull();
    expect(result.depositAmount).toBeNull();
  });

  it('gives no amounts when nothing is selected', () => {
    const result = estimate({ food: [], drinks: [], entertainment: [], decorations: [] });
    expect(result.kind).toBe('on-request');
    expect(result.onRequestItems).toEqual([]);
    expect(result.depositAmount).toBeNull();
  });

  it('rounds the deposit to a whole pence', () => {
    const result = estimate({}, { ...business, depositPercent: 12.345 } as never);
    expect(result.depositAmount).toBe(Math.round((618_000 * 12.345) / 100));
    expect(Number.isInteger(result.depositAmount)).toBe(true);
  });

  it('always returns whole pence for every event, item and party size', () => {
    for (const eventType of table.columns) {
      for (const size of partySizes) {
        const result = estimate({ eventType, partySize: size.id });
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
      budget: 'under-1000',
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
