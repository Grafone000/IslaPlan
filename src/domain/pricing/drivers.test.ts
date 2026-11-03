import { describe, expect, it } from 'vitest';
import { business } from '@/config/business';
import { drinksOptions, foodOptions, guestLimits, type CatalogOption } from '../catalog';
import { analyseCostDrivers, type Suggestion } from './drivers';
import { calculateEstimate, type EstimateInput } from './engine';
import { priceTableV2 as table } from './table.v2';

const reference: EstimateInput = {
  eventType: 'wedding',
  guests: 50,
  food: ['dinner'],
  drinks: ['wine-only'],
  entertainment: ['dj'],
  decorations: ['flowers'],
};

const analyse = (input: Partial<EstimateInput> = {}, budget: number | null = null) =>
  analyseCostDrivers({ ...reference, ...input }, budget, table, business);

function applySuggestion(input: EstimateInput, suggestion: Suggestion): EstimateInput {
  if (suggestion.kind === 'fewer-guests') {
    return { ...input, guests: suggestion.to };
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
    expect(midpoint).toBe(587_500);
    expect(drivers.map(({ item, amount, sharePercent }) => [item, amount, sharePercent])).toEqual([
      ['dinner', 337_500, 57],
      ['wine-only', 97_500, 17],
      ['dj', 77_500, 13],
      ['flowers', 75_000, 13],
    ]);
  });

  it('driver amounts add up to the midpoint', () => {
    const { midpoint, drivers } = analyse();
    expect(drivers.reduce((total, driver) => total + driver.amount, 0)).toBe(midpoint);
  });

  it('suggests the biggest savings first, at most three', () => {
    expect(analyse().suggestions).toEqual([
      {
        kind: 'swap-item',
        category: 'food',
        from: 'dinner',
        to: 'brunch',
        saving: 137_500,
      },
      { kind: 'fewer-guests', from: 50, to: 40, saving: 117_500 },
      {
        kind: 'remove-item',
        category: 'entertainment',
        item: 'dj',
        saving: 77_500,
      },
    ]);
  });

  it('never suggests removing the only item of a required step', () => {
    const removals = analyse({ guests: guestLimits.min }).suggestions.filter(
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
      saving: 337_500,
    });
  });

  it('has no fewer guests suggestion at the minimum', () => {
    const { suggestions } = analyse({ guests: guestLimits.min });
    expect(suggestions.some((suggestion) => suggestion.kind === 'fewer-guests')).toBe(false);
  });

  it('never suggests fewer guests than the minimum', () => {
    const fewer = analyse({ guests: 15 }).suggestions.find((s) => s.kind === 'fewer-guests');
    expect(fewer).toMatchObject({ from: 15, to: guestLimits.min });
  });

  it('every suggestion lowers the estimate by exactly its saving and stays valid', () => {
    for (const eventType of table.columns) {
      for (const guests of [guestLimits.min, 15, 50, guestLimits.max]) {
        for (const food of [['private-chef'], ['dinner', 'canapes'], ['afternoon-tea']] as const) {
          for (const drinks of [['drinks-all'], ['wine-tasting', 'byo-drinks']] as const) {
            const input: EstimateInput = {
              ...reference,
              eventType,
              guests,
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
      difference: 87_500,
    });
  });

  it('has no budget gap at the top of the slider or without a budget', () => {
    expect(analyse({}, 2_000_000).budgetGap).toBeNull();
    expect(analyse({}, null).budgetGap).toBeNull();
  });

  it('has nothing to show for an on-request event', () => {
    expect(analyse({ eventType: 'other-bespoke', decorations: [] }, 500_000)).toEqual({
      midpoint: null,
      drivers: [],
      suggestions: [],
      budgetGap: null,
    });
  });
});
