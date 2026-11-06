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
import { priceTableV3 as table, type PriceRow } from './table.v3';

const rows: PriceRow[] = Object.values(table.rows).flatMap((category) => Object.values(category));
const cells = rows.flat();

describe('price table v3', () => {
  it('has the version the app is configured for', () => {
    expect(table.version).toBe(business.pricingVersion);
  });

  it('has the sheet rows without the masterclass and tasting, plus Brunch and own food', () => {
    expect(rows).toHaveLength(20);
    expect(rows.every((row) => row.length === 10)).toBe(true);
    expect(table.columns).toEqual(eventTypes.map((type) => type.id));
  });

  it('has 175 numeric cells and 25 on-request cells', () => {
    expect(cells.filter((cell) => cell !== null)).toHaveLength(175);
    expect(cells.filter((cell) => cell === null)).toHaveLength(25);
  });

  it('has low not above high in every numeric cell', () => {
    for (const cell of cells) {
      if (cell) {
        expect(cell[0]).toBeLessThanOrEqual(cell[1]);
      }
    }
  });

  it('prices Brunch like Lunch until it has its own prices', () => {
    expect(table.rows.food.brunch).toEqual(table.rows.food.lunch);
  });

  it('makes own food free and Flowers and Balloons £15 per person for every event', () => {
    expect(table.rows.food['own-food'].every((cell) => cell?.[0] === 0 && cell[1] === 0)).toBe(
      true,
    );
    for (const item of ['flowers', 'balloons'] as const) {
      expect(table.rows.decorations[item].every((cell) => cell?.[0] === 15 && cell[1] === 15)).toBe(
        true,
      );
    }
  });

  it('prices every catalog option', () => {
    expect(Object.keys(table.rows.food)).toEqual(foodOptions.map((o) => o.id));
    expect(Object.keys(table.rows.drinks)).toEqual(drinksOptions.map((o) => o.id));
    expect(Object.keys(table.rows.entertainment)).toEqual(entertainmentOptions.map((o) => o.id));
    expect(Object.keys(table.rows.decorations)).toEqual(decorationOptions.map((o) => o.id));
  });

  it('marks the Other/Bespoke column as on request, except the fixed-price rows', () => {
    const index = table.columns.indexOf('other-bespoke');
    const fixed = [
      table.rows.food['own-food'],
      table.rows.drinks['wine-only'],
      table.rows.decorations.flowers,
      table.rows.decorations.balloons,
    ];
    expect(rows.filter((row) => !fixed.includes(row)).every((row) => row[index] === null)).toBe(
      true,
    );
  });

  it('prices Wine only by the bottle and Drinks all cocktails like Cocktails/spirits only', () => {
    expect(table.rows.drinks['wine-only'].every((cell) => cell?.[0] === 0 && cell[1] === 0)).toBe(
      true,
    );
    expect(table.rows.drinks['drinks-all']).toEqual(table.rows.drinks['cocktails-spirits-only']);
  });

  it('marks the whole Other/Bespoke decorations row as on request', () => {
    expect(table.rows.decorations['other-bespoke'].every((cell) => cell === null)).toBe(true);
  });

  it.each([
    ['wedding', 'food', 'private-chef', [100, 170]],
    ['wedding-proposal', 'food', 'private-chef', [105, 180]],
    ['family-friends-reunion', 'food', 'private-chef', [70, 120]],
    ['girls-boys-night', 'food', 'canapes', [12, 20]],
    ['wedding', 'drinks', 'cocktails-spirits-only', [20, 35]],
    ['baby-shower', 'drinks', 'private-sommelier', [5, 8]],
    ['baby-shower', 'drinks', 'byo-drinks', [1, 2]],
    ['family-friends-reunion', 'drinks', 'byo-drinks', [2, 4]],
    ['wedding-proposal', 'entertainment', 'dj', [5, 9]],
    ['hen-stag-do', 'entertainment', 'activities', [13, 45]],
    ['wedding', 'decorations', 'personalised-items', [6, 18]],
    ['family-friends-reunion', 'decorations', 'personalised-items', [3, 8]],
  ] as const)('matches the sheet for %s %s %s', (eventType, category, item, expected) => {
    expect(lookupPrice(table, eventType, category, item)).toEqual(expected);
  });
});
