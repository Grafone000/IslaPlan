import {
  bottleOf,
  bottlesPerGuest,
  partySizes,
  type DecorationId,
  type DrinksId,
  type EntertainmentId,
  type EventTypeId,
  type FoodId,
  type PartySizeId,
  type PricedCategory,
} from '../catalog';
import type { BottleLine, Estimate, EstimateItemRef, EstimateLine } from '../request';
import type { PriceRange, PriceRow, PriceTable } from './table.v3';

export interface EstimateInput {
  eventType: EventTypeId;
  partySize: PartySizeId;
  food: readonly FoodId[];
  drinks: readonly DrinksId[];
  entertainment: readonly EntertainmentId[];
  decorations: readonly DecorationId[];
  // Bottles the client picked for Wine only.
  wineBottles: readonly { product: string; quantity: number }[];
  // The Drinks all package and its bottle, if chosen.
  drinksAll: { package: string | undefined; product: string | null } | null;
}

export interface PricingConfig {
  currency: string;
  depositPercent: number;
}

const PENCE_PER_POUND = 100;

const pricedCategories: readonly PricedCategory[] = [
  'food',
  'drinks',
  'entertainment',
  'decorations',
];

export function lookupPrice(
  table: PriceTable,
  eventType: EventTypeId,
  category: PricedCategory,
  item: string,
): PriceRange | null {
  const rows: Record<string, PriceRow> = table.rows[category];
  const row = rows[item];
  if (!row) {
    throw new Error(`Unknown ${category} item: ${item}`);
  }
  return row[table.columns.indexOf(eventType)] ?? null;
}

const isFree = (price: PriceRange) => price[0] === 0 && price[1] === 0;

// Bottles are priced by the bottle, not per person, so they are not in the per-person lines.
function bottleLinesOf(input: EstimateInput, guestsMin: number, guestsMax: number): BottleLine[] {
  const lines: BottleLine[] = [];
  if (input.drinks.includes('wine-only')) {
    for (const { product, quantity } of input.wineBottles) {
      const bottle = bottleOf(product);
      if (bottle && quantity > 0) {
        const amount = bottle.priceMinor * quantity;
        lines.push({
          item: 'wine-only',
          product,
          pricePerBottle: bottle.priceMinor,
          quantityLow: quantity,
          quantityHigh: quantity,
          amountLow: amount,
          amountHigh: amount,
        });
      }
    }
  }
  const drinksAll = input.drinks.includes('drinks-all') ? input.drinksAll : null;
  const bottle = bottleOf(drinksAll?.product ?? undefined);
  const perGuest = bottlesPerGuest[drinksAll?.package ?? ''];
  if (bottle && perGuest) {
    const quantityLow = Math.ceil(guestsMin * perGuest);
    const quantityHigh = Math.ceil(guestsMax * perGuest);
    lines.push({
      item: 'drinks-all',
      product: bottle.id,
      pricePerBottle: bottle.priceMinor,
      quantityLow,
      quantityHigh,
      amountLow: bottle.priceMinor * quantityLow,
      amountHigh: bottle.priceMinor * quantityHigh,
    });
  }
  return lines;
}

export function calculateEstimate(
  input: EstimateInput,
  table: PriceTable,
  config: PricingConfig,
): Estimate {
  const { guestsMin, guestsMax } = partySizeById(input.partySize);
  const lines: EstimateLine[] = [];
  const onRequestItems: EstimateItemRef[] = [];

  for (const category of pricedCategories) {
    for (const item of input[category]) {
      const price = lookupPrice(table, input.eventType, category, item);
      if (!price) {
        onRequestItems.push({ category, item });
      } else if (!isFree(price)) {
        // Free items, such as food the client brings, are neither a cost nor a question.
        lines.push({
          category,
          item,
          lowPerPerson: price[0] * PENCE_PER_POUND,
          highPerPerson: price[1] * PENCE_PER_POUND,
        });
      }
    }
  }
  const bottleLines = bottleLinesOf(input, guestsMin, guestsMax);

  const base = {
    pricingVersion: table.version,
    currency: config.currency,
    guestsMin,
    guestsMax,
    lines,
    bottleLines,
    onRequestItems,
    depositPercent: config.depositPercent,
  };

  if (lines.length === 0 && bottleLines.length === 0) {
    return {
      ...base,
      kind: 'on-request',
      totalLow: null,
      totalHigh: null,
      midpoint: null,
      depositAmount: null,
    };
  }

  const totalLow =
    sum(lines.map((line) => line.lowPerPerson)) * guestsMin +
    sum(bottleLines.map((line) => line.amountLow));
  const totalHigh =
    sum(lines.map((line) => line.highPerPerson)) * guestsMax +
    sum(bottleLines.map((line) => line.amountHigh));
  const midpoint = Math.round((totalLow + totalHigh) / 2);

  return {
    ...base,
    kind: onRequestItems.length > 0 ? 'partial' : 'priced',
    totalLow,
    totalHigh,
    midpoint,
    depositAmount: Math.round((midpoint * config.depositPercent) / 100),
  };
}

function partySizeById(id: PartySizeId) {
  const size = partySizes.find((candidate) => candidate.id === id);
  if (!size) {
    throw new Error(`Unknown party size: ${id}`);
  }
  return size;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
