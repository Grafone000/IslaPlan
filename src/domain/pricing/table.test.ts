import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import {
  decorationOptions,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodOptions,
} from '../catalog';
import { lookupPrice } from './engine';
import { priceTableV1 as table, type PriceRow } from './table.v1';

const rows: PriceRow[] = Object.values(table.rows).flatMap((category) => Object.values(category));
const cells = rows.flat();

describe('price table v1', () => {
  it('has the version the app is configured for', () => {
    expect(table.version).toBe(business.pricingVersion);
  });

  it('has 20 rows and 10 columns, like the sheet', () => {
    expect(rows).toHaveLength(20);
    expect(rows.every((row) => row.length === 10)).toBe(true);
    expect(table.columns).toEqual(eventTypes.map((type) => type.id));
  });

  it('has 171 numeric cells and 29 on-request cells', () => {
    expect(cells.filter((cell) => cell !== null)).toHaveLength(171);
    expect(cells.filter((cell) => cell === null)).toHaveLength(29);
  });

  it('has low below high in every numeric cell', () => {
    for (const cell of cells) {
      if (cell) {
        expect(cell[0]).toBeLessThan(cell[1]);
      }
    }
  });

  it('prices every catalog option', () => {
    expect(Object.keys(table.rows.food)).toEqual(foodOptions.map((o) => o.id));
    expect(Object.keys(table.rows.drinks)).toEqual(drinksOptions.map((o) => o.id));
    expect(Object.keys(table.rows.entertainment)).toEqual(entertainmentOptions.map((o) => o.id));
    expect(Object.keys(table.rows.decorations)).toEqual(decorationOptions.map((o) => o.id));
  });

  it('marks the whole Other/Bespoke column as on request', () => {
    const index = table.columns.indexOf('other-bespoke');
    expect(rows.every((row) => row[index] === null)).toBe(true);
  });

  it('marks the whole Other/Bespoke decorations row as on request', () => {
    expect(table.rows.decorations['other-bespoke'].every((cell) => cell === null)).toBe(true);
  });

  it.each([
    ['wedding', 'food', 'private-chef', [100, 170]],
    ['wedding-proposal', 'food', 'private-chef', [105, 180]],
    ['family-friends-reunion', 'food', 'private-chef', [70, 120]],
    ['girls-boys-night', 'food', 'canapes', [12, 20]],
    ['wedding', 'drinks', 'cocktails-masterclass', [40, 60]],
    ['baby-shower', 'drinks', 'cocktails-masterclass', [9, 14]],
    ['baby-shower', 'drinks', 'byo-drinks', [1, 2]],
    ['family-friends-reunion', 'drinks', 'byo-drinks', [2, 4]],
    ['wedding-proposal', 'entertainment', 'dj', [5, 9]],
    ['hen-stag-do', 'entertainment', 'activities', [13, 45]],
    ['wedding', 'decorations', 'flowers', [9, 20]],
    ['family-friends-reunion', 'decorations', 'personalised-items', [3, 8]],
  ] as const)('matches the sheet for %s %s %s', (eventType, category, item, expected) => {
    expect(lookupPrice(table, eventType, category, item)).toEqual(expected);
  });
});
