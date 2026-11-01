import type {
  DecorationId,
  DrinksId,
  EntertainmentId,
  EventTypeId,
  FoodId,
} from '../catalog';

export type PriceRange = readonly [low: number, high: number];

// One cell per entry in PriceTable.columns; null means "On request".
export type PriceRow = readonly (PriceRange | null)[];

export interface PriceTable {
  version: string;
  columns: readonly EventTypeId[];
  rows: {
    food: Record<FoodId, PriceRow>;
    drinks: Record<DrinksId, PriceRow>;
    entertainment: Record<EntertainmentId, PriceRow>;
    decorations: Record<DecorationId, PriceRow>;
  };
}

// Generated from 6baf2c930_stima_prezzi_eventi.xlsx. Pounds per person, as in the sheet.
export const priceTableV1: PriceTable = {
  version: 'pricing-v1',
  columns: [
    'wedding',
    'birthday',
    'engagement',
    'wedding-proposal',
    'hen-stag-do',
    'baby-shower',
    'graduation',
    'girls-boys-night',
    'family-friends-reunion',
    'other-bespoke',
  ],
  rows: {
    food: {
      'private-chef': [
        [100, 170], [70, 120], [85, 145], [105, 180], [65, 110],
        [75, 130], [65, 110], [55, 95], [70, 120], null,
      ],
      lunch: [
        [30, 50], [20, 35], [25, 40], [30, 50], [18, 30],
        [20, 40], [18, 30], [16, 30], [20, 35], null,
      ],
      dinner: [
        [50, 85], [35, 60], [40, 70], [50, 90], [30, 55],
        [40, 65], [30, 55], [30, 50], [35, 60], null,
      ],
      'afternoon-tea': [
        [25, 40], [18, 30], [20, 35], [25, 45], [16, 25],
        [20, 35], [16, 25], [14, 25], [18, 30], null,
      ],
      canapes: [
        [20, 35], [15, 25], [18, 30], [20, 40], [14, 20],
        [16, 30], [14, 20], [12, 20], [15, 25], null,
      ],
    },
    drinks: {
      'cocktails-masterclass': [
        [40, 60], [30, 45], [35, 50], [40, 60], [40, 60],
        [9, 14], [25, 40], [35, 55], [25, 35], null,
      ],
      'wine-tasting': [
        [35, 55], [25, 40], [30, 45], [30, 50], [30, 50],
        [8, 12], [20, 35], [30, 50], [20, 30], null,
      ],
      'private-bartender': [
        [16, 25], [12, 20], [14, 25], [16, 25], [16, 25],
        [4, 6], [11, 18], [14, 25], [10, 16], null,
      ],
      'private-sommelier': [
        [25, 40], [18, 30], [20, 30], [25, 35], [25, 35],
        [5, 8], [16, 25], [20, 35], [14, 20], null,
      ],
      'drinks-all': [
        [25, 55], [20, 40], [25, 45], [25, 50], [25, 50],
        [6, 12], [18, 35], [25, 50], [16, 30], null,
      ],
      'wine-only': [
        [14, 25], [10, 18], [12, 20], [13, 25], [13, 25],
        [3, 5], [9, 16], [12, 20], [8, 14], null,
      ],
      'cocktails-spirits-only': [
        [20, 35], [15, 25], [17, 30], [20, 30], [20, 30],
        [4, 8], [14, 20], [18, 30], [12, 20], null,
      ],
      'byo-drinks': [
        [3, 7], [2, 5], [2, 6], [3, 6], [3, 6],
        [1, 2], [2, 4], [2, 6], [2, 4], null,
      ],
    },
    entertainment: {
      dj: [
        [11, 20], [8, 15], [9, 16], [5, 9], [10, 20],
        [5, 9], [7, 14], [9, 16], [6, 10], null,
      ],
      'live-music': [
        [17, 35], [12, 25], [13, 30], [7, 15], [16, 30],
        [7, 15], [11, 20], [13, 30], [8, 18], null,
      ],
      activities: [
        [14, 50], [10, 35], [11, 40], [6, 20], [13, 45],
        [6, 20], [9, 30], [11, 40], [7, 25], null,
      ],
    },
    decorations: {
      flowers: [
        [9, 20], [6, 15], [7, 18], [10, 25], [5, 12],
        [7, 18], [5, 14], [4, 10], [4, 10], null,
      ],
      balloons: [
        [3, 9], [2, 6], [2, 7], [3, 10], [2, 5],
        [2, 7], [2, 5], [1, 4], [1, 4], null,
      ],
      'personalised-items': [
        [6, 18], [4, 12], [5, 14], [6, 19], [3, 10],
        [5, 14], [4, 11], [3, 8], [3, 8], null,
      ],
      'other-bespoke': [
        null, null, null, null, null,
        null, null, null, null, null,
      ],
    },
  },
};
