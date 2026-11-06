import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { partySizes } from '../catalog';
import { calculateEstimate, lookupPrice, type EstimateInput } from './engine';
import { priceTableV3 as table } from './table.v3';

const reference: EstimateInput = {
  eventType: 'wedding',
  partySize: 'size-40-60',
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: ['dj'],
  decorations: ['flowers'],
  wineBottles: [{ product: 'house-red', quantity: 10 }],
  drinksAll: null,
};

const estimate = (input: Partial<EstimateInput> = {}, config = business) =>
  calculateEstimate({ ...reference, ...input }, table, config);

describe('calculateEstimate', () => {
  it('matches the reference case', () => {
    const result = estimate();
    expect(result.kind).toBe('priced');
    expect(result.guestsMin).toBe(40);
    expect(result.guestsMax).toBe(60);
    expect(result.totalLow).toBe(320_000);
    expect(result.totalHigh).toBe(736_000);
    expect(result.midpoint).toBe(528_000);
    expect(result.depositAmount).toBe(105_600);
    expect(result.pricingVersion).toBe('pricing-v3');
  });

  it('keeps per-person lines in pence and Wine only out of them', () => {
    expect(estimate().lines).toEqual([
      { category: 'food', item: 'dinner', lowPerPerson: 5000, highPerPerson: 8500 },
      { category: 'entertainment', item: 'dj', lowPerPerson: 1100, highPerPerson: 2000 },
      { category: 'decorations', item: 'flowers', lowPerPerson: 1500, highPerPerson: 1500 },
    ]);
  });

  it('prices Wine only by the bottles the client chose', () => {
    expect(estimate().bottleLines).toEqual([
      {
        item: 'wine-only',
        product: 'house-red',
        pricePerBottle: 1600,
        quantityLow: 10,
        quantityHigh: 10,
        amountLow: 16_000,
        amountHigh: 16_000,
      },
    ]);
    const two = estimate({
      wineBottles: [
        { product: 'house-red', quantity: 10 },
        { product: 'champagne-brut-reserve', quantity: 2 },
      ],
    });
    expect(two.totalLow).toBe(320_000 + 2 * 6_000);
  });

  it('prices the Drinks all bottle per guest: one each with 4 cocktails, half otherwise', () => {
    const full = estimate({
      drinks: ['drinks-all'],
      wineBottles: [],
      drinksAll: { package: 'four-cocktails-bottle', product: 'prosecco-extra-dry' },
    });
    expect(full.bottleLines[0]).toMatchObject({ quantityLow: 40, quantityHigh: 60 });
    // Cocktails at the Cocktails/spirits only price, plus the bottles.
    expect(full.totalLow).toBe((50 + 20 + 11 + 15) * 100 * 40 + 40 * 2_400);
    expect(full.totalHigh).toBe((85 + 35 + 20 + 15) * 100 * 60 + 60 * 2_400);

    const half = estimate({
      drinks: ['drinks-all'],
      wineBottles: [],
      drinksAll: { package: 'three-cocktails-half-bottle', product: 'prosecco-extra-dry' },
    });
    expect(half.bottleLines[0]).toMatchObject({ quantityLow: 20, quantityHigh: 30 });
  });

  it('rounds half bottles up', () => {
    const result = estimate({
      partySize: 'size-10-20',
      drinks: ['drinks-all'],
      wineBottles: [],
      drinksAll: { package: 'one-cocktail-half-bottle', product: 'house-red' },
    });
    expect(result.bottleLines[0]).toMatchObject({ quantityLow: 5, quantityHigh: 10 });
  });

  it('ignores bottles of drinks that are not chosen, or not yet picked', () => {
    expect(estimate({ drinks: ['cocktails-spirits-only'] }).bottleLines).toEqual([]);
    expect(
      estimate({
        drinks: ['drinks-all'],
        wineBottles: [],
        drinksAll: { package: 'four-cocktails-bottle', product: null },
      }).bottleLines,
    ).toEqual([]);
  });

  it.each(partySizes.map((size) => [size.id, size.guestsMin, size.guestsMax] as const))(
    'uses the guest limits of %s',
    (partySize, guestsMin, guestsMax) => {
      const result = estimate({ partySize });
      expect(result.totalLow).toBe(76 * 100 * guestsMin + 16_000);
      expect(result.totalHigh).toBe(120 * 100 * guestsMax + 16_000);
    },
  );

  it('prices Brunch like Lunch and leaves own food out', () => {
    expect(estimate({ food: ['brunch'] }).totalLow).toBe(estimate({ food: ['lunch'] }).totalLow);
    expect(estimate({ food: ['dinner', 'own-food'] })).toEqual(estimate());
  });

  it('leaves on-request items out of a partial estimate', () => {
    const result = estimate({ decorations: ['flowers', 'other-bespoke'] });
    expect(result.kind).toBe('partial');
    expect(result.onRequestItems).toEqual([{ category: 'decorations', item: 'other-bespoke' }]);
    expect(result.midpoint).toBe(estimate().midpoint);
  });

  it('gives no amounts when nothing has a price', () => {
    const result = estimate({ eventType: 'other-bespoke', drinks: [], decorations: [] });
    expect(result.kind).toBe('on-request');
    expect(result.totalLow).toBeNull();
    expect(result.depositAmount).toBeNull();
  });

  it('prices the bottles of an Other/Bespoke event even when the rest is on request', () => {
    const result = estimate({ eventType: 'other-bespoke', decorations: [] });
    expect(result.kind).toBe('partial');
    expect(result.totalLow).toBe(16_000);
  });

  it('always returns whole pence', () => {
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
    const noisy = { ...reference, date: '2027-05-14', budget: 100_000, additionalInfo: 'Anything' };
    expect(calculateEstimate(noisy, table, business)).toEqual(estimate());
  });
});

describe('lookupPrice', () => {
  it('returns null for on-request cells', () => {
    expect(lookupPrice(table, 'wedding', 'decorations', 'other-bespoke')).toBeNull();
  });

  it('rejects an unknown or removed item', () => {
    expect(() => lookupPrice(table, 'wedding', 'food', 'pizza')).toThrow('Unknown food item');
    expect(() => lookupPrice(table, 'wedding', 'drinks', 'wine-tasting')).toThrow();
  });
});
