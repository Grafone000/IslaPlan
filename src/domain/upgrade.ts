import { budgetLimits } from './catalog';
import { SCHEMA_VERSION, type Estimate, type EventRequest } from './request';

// Schema 1 stored party size and budget as bands, and food and drinks as plain lists.
const v1Guests: Record<string, number> = {
  'size-10-20': 20,
  'size-20-40': 40,
  'size-40-60': 60,
  'size-60-80': 80,
  'size-up-to-100': 100,
};

const v1Budgets: Record<string, number> = {
  'under-1000': 100_000,
  '1000-2500': 250_000,
  '2500-5000': 500_000,
  '5000-10000': 1_000_000,
  'over-10000': budgetLimits.maxMinor,
};

type Loose = Record<string, unknown>;

// Reads a stored request of any schema as the current one. A schema 1 request keeps its
// amounts; its guests become the top of the old band, its budget the top of the old band.
// It has no menus or drinks packages, so an edit asks for them.
export function upgradeRequest(payload: unknown): EventRequest {
  const request = payload as Loose;
  if (request.schemaVersion !== 1) {
    return payload as EventRequest;
  }
  const event = request.event as Loose;
  const estimate = request.estimate as Loose | null;
  const entertainment = event.entertainment as Loose;
  const { partySize, ...rest } = event;
  return {
    ...(request as unknown as EventRequest),
    schemaVersion: SCHEMA_VERSION,
    event: {
      ...(rest as unknown as EventRequest['event']),
      guests: v1Guests[partySize as string] ?? null,
      food: {
        items: event.food as EventRequest['event']['food']['items'],
        menus: {},
        ownFoodNote: null,
      },
      drinks: {
        items: event.drinks as EventRequest['event']['drinks']['items'],
        packages: {},
        times: {},
        ownDrinksNote: null,
      },
      entertainment: {
        items: entertainment.items as EventRequest['event']['entertainment']['items'],
        times: {},
        activitiesPreference: (entertainment.activitiesPreference as string | null) ?? null,
      },
      budget: v1Budgets[event.budget as string] ?? null,
    },
    estimate: estimate ? upgradeEstimate(estimate) : null,
  };
}

function upgradeEstimate(estimate: Loose): Estimate {
  const kept: Loose = { ...estimate, guests: estimate.guestsMax };
  delete kept.guestsMin;
  delete kept.guestsMax;
  return kept as unknown as Estimate;
}
