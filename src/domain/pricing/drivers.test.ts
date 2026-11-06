import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { drinksOptions, foodOptions, partySizes, type CatalogOption } from '../catalog';
import { analyseCostDrivers, type Suggestion } from './drivers';
import { calculateEstimate, type EstimateInput } from './engine';
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

const analyse = (input: Partial<EstimateInput> = {}, budget: number | null = null) =>
  analyseCostDrivers({ ...reference, ...input }, budget, table, business);

function applySuggestion(input: EstimateInput, suggestion: Suggestion): EstimateInput {
  if (suggestion.kind === 'smaller-party') {
    return { ...input, partySize: suggestion.to };
  }
  const items: readonly string[] = input[suggestion.category];
  const changed =
    suggestion.kind === 'swap-item'
      ? items.map((id) => (id === suggestion.from ? suggestion.to : id))
      : items.filter((id) => id !== suggestion.item);
  return { ...input, [suggestion.category]: changed };
}

const hasConflict = (selected: readonly string[], options: readonly CatalogOption[]) =>
  options
    .filter((option) => selected.includes(option.id))
    .some((option) => option.excludes?.some((id) => selected.includes(id)));

describe('analyseCostDrivers', () => {
  it('ranks items by their share of the midpoint in the reference case', () => {
    const { midpoint, drivers } = analyse();
    expect(midpoint).toBe(528_000);
    expect(drivers.map(({ item, amount, sharePercent }) => [item, amount, sharePercent])).toEqual([
      ['dinner', 355_000, 67],
      ['dj', 82_000, 16],
      ['flowers', 75_000, 14],
      ['wine-only', 16_000, 3],
    ]);
  });

  it('driver amounts add up to the midpoint', () => {
    const { midpoint, drivers } = analyse();
    expect(drivers.reduce((total, driver) => total + driver.amount, 0)).toBe(midpoint);
  });

  it('suggests the biggest savings first, at most three', () => {
    expect(analyse().suggestions).toEqual([
      { kind: 'smaller-party', from: 'size-40-60', to: 'size-20-40', saving: 196_000 },
      { kind: 'swap-item', category: 'food', from: 'dinner', to: 'brunch', saving: 145_000 },
      { kind: 'remove-item', category: 'entertainment', item: 'dj', saving: 82_000 },
    ]);
  });

  it('counts the Drinks all bottles in its driver', () => {
    const { drivers, midpoint } = analyse({
      drinks: ['drinks-all'],
      drinksAll: { package: 'four-cocktails-bottle', product: 'prosecco-extra-dry' },
    });
    const drinksAll = drivers.find((driver) => driver.item === 'drinks-all');
    // Cocktails (20-35 per person) plus 40 to 60 bottles at £24.
    expect(drinksAll?.amount).toBe((2000 * 40 + 3500 * 60) / 2 + (40 + 60) * 1200);
    expect(drivers.reduce((total, driver) => total + driver.amount, 0)).toBe(midpoint);
  });

  it('never suggests switching to a drink that needs bottles picked', () => {
    const { suggestions } = analyse({ drinks: ['cocktails-spirits-only'] });
    expect(
      suggestions.some((s) => s.kind === 'swap-item' && ['wine-only', 'drinks-all'].includes(s.to)),
    ).toBe(false);
  });

  it('never suggests removing the only item of a required step', () => {
    const removals = analyse({ partySize: 'size-10-20' }).suggestions.filter(
      (suggestion) => suggestion.kind === 'remove-item',
    );
    expect(removals.every((s) => s.kind === 'remove-item' && s.category !== 'food')).toBe(true);
    expect(removals.every((s) => s.kind === 'remove-item' && s.category !== 'drinks')).toBe(true);
  });

  it('can remove a required-step item when another one stays', () => {
    const { suggestions } = analyse({ food: ['dinner', 'canapes'] });
    expect(suggestions).toContainEqual({
      kind: 'remove-item',
      category: 'food',
      item: 'dinner',
      saving: 355_000,
    });
  });

  it('has no smaller party suggestion at the smallest size', () => {
    const { suggestions } = analyse({ partySize: 'size-10-20' });
    expect(suggestions.some((suggestion) => suggestion.kind === 'smaller-party')).toBe(false);
  });

  it('every suggestion lowers the estimate by exactly its saving and stays valid', () => {
    for (const eventType of table.columns) {
      for (const size of partySizes) {
        for (const food of [['private-chef'], ['dinner', 'canapes'], ['afternoon-tea']] as const) {
          for (const drinks of [['drinks-all'], ['private-bartender', 'byo-drinks']] as const) {
            const input: EstimateInput = {
              ...reference,
              eventType,
              partySize: size.id,
              food,
              drinks,
            };
            const before = calculateEstimate(input, table, business).midpoint;
            for (const suggestion of analyse(input).suggestions) {
              const changed = applySuggestion(input, suggestion);
              const after = calculateEstimate(changed, table, business).midpoint;
              expect(suggestion.saving).toBeGreaterThan(0);
              expect(after).toBe((before ?? 0) - suggestion.saving);
              expect(changed.food.length).toBeGreaterThan(0);
              expect(changed.drinks.length).toBeGreaterThan(0);
              expect(hasConflict(changed.food, foodOptions)).toBeFalsy();
              expect(hasConflict(changed.drinks, drinksOptions)).toBeFalsy();
            }
          }
        }
      }
    }
  });

  it('never swaps to an on-request item', () => {
    const { suggestions } = analyse({ decorations: ['flowers'] });
    const swaps = suggestions.filter((suggestion) => suggestion.kind === 'swap-item');
    expect(swaps.some((swap) => swap.to === 'other-bespoke')).toBe(false);
  });

  it('shows the distance from the budget', () => {
    expect(analyse({}, 500_000).budgetGap).toEqual({
      budget: 500_000,
      difference: 28_000,
    });
  });

  it('has no budget gap at the top of the slider or without a budget', () => {
    expect(analyse({}, 2_000_000).budgetGap).toBeNull();
    expect(analyse({}, null).budgetGap).toBeNull();
  });

  it('has nothing to show for an on-request event', () => {
    expect(
      analyse({ eventType: 'other-bespoke', drinks: [], decorations: [] }, 500_000),
    ).toEqual({
      midpoint: null,
      drivers: [],
      suggestions: [],
      budgetGap: null,
    });
  });
});
