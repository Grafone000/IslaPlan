import {
  budgetLimits,
  partySizes,
  pricedCategoryOptions as categoryOptions,
  type PartySizeId,
  type PricedCategory,
} from '../catalog';
import { calculateEstimate, lookupPrice, type EstimateInput, type PricingConfig } from './engine';
import type { PriceTable } from './table.v3';

export interface CostDriver {
  category: PricedCategory;
  item: string;
  amount: number;
  sharePercent: number;
}

export type Suggestion =
  | { kind: 'smaller-party'; from: PartySizeId; to: PartySizeId; saving: number }
  | { kind: 'swap-item'; category: PricedCategory; from: string; to: string; saving: number }
  | { kind: 'remove-item'; category: PricedCategory; item: string; saving: number };

export interface BudgetGap {
  budget: number;
  // Positive when the midpoint is over the budget.
  difference: number;
}

export interface CostAnalysis {
  midpoint: number | null;
  drivers: CostDriver[];
  suggestions: Suggestion[];
  budgetGap: BudgetGap | null;
}

type SavingOf = (changed: EstimateInput) => number;

const MAX_SUGGESTIONS = 3;

// These need the client to pick bottles, so a swap to them has no price to compare.
const needsBottles = ['wine-only', 'drinks-all'];

const requiredCategories: readonly PricedCategory[] = ['food', 'drinks'];

export function analyseCostDrivers(
  input: EstimateInput,
  budget: number | null,
  table: PriceTable,
  config: PricingConfig,
): CostAnalysis {
  const estimate = calculateEstimate(input, table, config);
  const { midpoint, guestsMin, guestsMax } = estimate;
  if (midpoint === null) {
    return { midpoint: null, drivers: [], suggestions: [], budgetGap: null };
  }

  // An item's cost is its per-person part plus any bottles that come with it.
  const amounts = new Map<string, { category: PricedCategory; item: string; amount: number }>();
  const add = (category: PricedCategory, item: string, amount: number) => {
    const key = `${category}:${item}`;
    const current = amounts.get(key);
    amounts.set(key, { category, item, amount: (current?.amount ?? 0) + amount });
  };
  for (const { category, item, lowPerPerson, highPerPerson } of estimate.lines) {
    add(category, item, (lowPerPerson * guestsMin + highPerPerson * guestsMax) / 2);
  }
  for (const line of estimate.bottleLines) {
    add('drinks', line.item, (line.amountLow + line.amountHigh) / 2);
  }
  const drivers = [...amounts.values()]
    .map((driver) => ({
      ...driver,
      sharePercent: Math.round((driver.amount / midpoint) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);

  const savingOf: SavingOf = (changed) =>
    midpoint - (calculateEstimate(changed, table, config).midpoint ?? midpoint);

  const isPriced = (category: PricedCategory, item: string) =>
    lookupPrice(table, input.eventType, category, item) !== null;

  // Each item offers its best change only, so one item cannot fill the whole list.
  const itemSuggestions = drivers.flatMap(({ category, item }) =>
    [
      swapSuggestion(input, category, item, isPriced, savingOf),
      removeSuggestion(input, category, item, savingOf),
    ]
      .filter((suggestion) => suggestion !== null)
      .sort((a, b) => b.saving - a.saving)
      .slice(0, 1),
  );

  const suggestions = [smallerPartySuggestion(input, savingOf), ...itemSuggestions]
    .filter((suggestion) => suggestion !== null)
    .filter((suggestion) => suggestion.saving > 0)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, MAX_SUGGESTIONS);

  return { midpoint, drivers, suggestions, budgetGap: budgetGapOf(budget, midpoint) };
}

function withItems(
  input: EstimateInput,
  category: PricedCategory,
  items: readonly string[],
): EstimateInput {
  return { ...input, [category]: items };
}

function respectsExclusions(category: PricedCategory, items: readonly string[]): boolean {
  return categoryOptions[category]
    .filter((option) => items.includes(option.id))
    .every((option) => !option.excludes?.some((excluded) => items.includes(excluded)));
}

// The next cheaper option, not the cheapest: the smallest step down stays closest to what
// the client chose.
function swapSuggestion(
  input: EstimateInput,
  category: PricedCategory,
  item: string,
  isPriced: (category: PricedCategory, item: string) => boolean,
  savingOf: SavingOf,
): Suggestion | null {
  const selected: readonly string[] = input[category];
  const [next] = categoryOptions[category]
    .filter(
      (option) =>
        !selected.includes(option.id) &&
        !needsBottles.includes(option.id) &&
        isPriced(category, option.id),
    )
    .map((option) => ({
      to: option.id,
      items: selected.map((id) => (id === item ? option.id : id)),
    }))
    .filter(({ items }) => respectsExclusions(category, items))
    .map(({ to, items }) => ({ to, saving: savingOf(withItems(input, category, items)) }))
    .filter(({ saving }) => saving > 0)
    .sort((a, b) => a.saving - b.saving);

  return next ? { kind: 'swap-item', category, from: item, to: next.to, saving: next.saving } : null;
}

function removeSuggestion(
  input: EstimateInput,
  category: PricedCategory,
  item: string,
  savingOf: SavingOf,
): Suggestion | null {
  const remaining = (input[category] as readonly string[]).filter((id) => id !== item);
  if (remaining.length === 0 && requiredCategories.includes(category)) {
    return null;
  }
  const saving = savingOf(withItems(input, category, remaining));
  return { kind: 'remove-item', category, item, saving };
}

function smallerPartySuggestion(input: EstimateInput, savingOf: SavingOf): Suggestion | null {
  const index = partySizes.findIndex((size) => size.id === input.partySize);
  if (index <= 0) {
    return null;
  }
  const to = partySizes[index - 1].id;
  return {
    kind: 'smaller-party',
    from: input.partySize,
    to,
    saving: savingOf({ ...input, partySize: to }),
  };
}

// The top of the slider means "or more", so it sets no limit to compare with.
function budgetGapOf(budget: number | null, midpoint: number): BudgetGap | null {
  if (budget === null || budget >= budgetLimits.maxMinor) {
    return null;
  }
  return { budget, difference: midpoint - budget };
}
