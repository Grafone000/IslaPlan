import type {
  DecorationId,
  DrinksId,
  EntertainmentId,
  EventTypeId,
  FoodId,
  PricedCategory,
} from '../catalog';
import type { Estimate, EstimateItemRef, EstimateLine } from '../request';
import type { PriceRange, PriceRow, PriceTable } from './table.v2';

export interface EstimateInput {
  eventType: EventTypeId;
  guests: number;
  food: readonly FoodId[];
  drinks: readonly DrinksId[];
  entertainment: readonly EntertainmentId[];
  decorations: readonly DecorationId[];
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

export function calculateEstimate(
  input: EstimateInput,
  table: PriceTable,
  config: PricingConfig,
): Estimate {
  const { guests } = input;
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

  const base = {
    pricingVersion: table.version,
    currency: config.currency,
    guests,
    lines,
    onRequestItems,
    depositPercent: config.depositPercent,
  };

  if (lines.length === 0) {
    return {
      ...base,
      kind: 'on-request',
      totalLow: null,
      totalHigh: null,
      midpoint: null,
      depositAmount: null,
    };
  }

  const totalLow = sum(lines.map((line) => line.lowPerPerson)) * guests;
  const totalHigh = sum(lines.map((line) => line.highPerPerson)) * guests;
  const midpoint = (totalLow + totalHigh) / 2;

  return {
    ...base,
    kind: onRequestItems.length > 0 ? 'partial' : 'priced',
    totalLow,
    totalHigh,
    midpoint,
    depositAmount: Math.round((midpoint * config.depositPercent) / 100),
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
