import { budgetLimits, drinksOptions, partySizes } from './catalog';
import { SCHEMA_VERSION, type Estimate, type EventDetails, type EventRequest } from './request';

const v1Budgets: Record<string, number> = {
  'under-1000': 100_000,
  '1000-2500': 250_000,
  '2500-5000': 500_000,
  '5000-10000': 1_000_000,
  'over-10000': budgetLimits.maxMinor,
};

// Schema 2 package ids that still mean the same number of cocktails.
const v2Packages: Record<string, Record<string, string>> = {
  'cocktails-spirits-only': {
    'four-cocktails-or-bottle': 'four-cocktails',
    'three-cocktails-or-half-bottle': 'three-cocktails',
    'two-cocktails-or-half-bottle': 'two-cocktails',
    'one-cocktail-or-half-bottle': 'one-cocktail',
  },
  'drinks-all': {
    'four-cocktails': 'four-cocktails-bottle',
    'three-cocktails': 'three-cocktails-half-bottle',
    'two-cocktails': 'two-cocktails-half-bottle',
    'one-cocktail': 'one-cocktail-half-bottle',
  },
};

type Loose = Record<string, unknown>;

const knownDrinks = (items: unknown) =>
  (items as string[]).filter((item) => drinksOptions.some((option) => option.id === item)) as
    EventDetails['drinks']['items'];

function bandOf(guests: number | null) {
  if (guests === null) return null;
  return partySizes.find((size) => guests <= size.guestsMax)?.id ?? 'size-up-to-100';
}

function upgradePackages(packages: Loose): EventDetails['drinks']['packages'] {
  const result: EventDetails['drinks']['packages'] = {};
  for (const drink of ['cocktails-spirits-only', 'drinks-all'] as const) {
    const id = v2Packages[drink][packages[drink] as string];
    if (id) result[drink] = id;
  }
  return result;
}

// Reads a stored request of any schema as the current one, keeping its amounts. Removed
// drinks are dropped, and bottles, menus and packages that did not exist are left empty,
// so an edit asks for them again.
export function upgradeRequest(payload: unknown): EventRequest {
  const request = payload as Loose;
  if (request.schemaVersion === SCHEMA_VERSION) {
    return payload as EventRequest;
  }
  const v1 = request.schemaVersion === 1;
  const event = request.event as Loose;
  const drinks = (v1 ? { items: event.drinks } : event.drinks) as Loose;
  const entertainment = event.entertainment as Loose;
  const { guests, ...rest } = event;
  return {
    ...(request as unknown as EventRequest),
    schemaVersion: SCHEMA_VERSION,
    event: {
      ...(rest as unknown as EventDetails),
      partySize: v1
        ? (event.partySize as EventDetails['partySize'])
        : bandOf((guests as number | null) ?? null),
      food: v1
        ? { items: event.food as EventDetails['food']['items'], menus: {}, ownFoodNote: null }
        : (event.food as EventDetails['food']),
      drinks: {
        items: knownDrinks(drinks.items),
        packages: v1 ? {} : upgradePackages((drinks.packages as Loose) ?? {}),
        drinksAllBottle: null,
        wineBottles: [],
        times: (drinks.times as EventDetails['drinks']['times']) ?? {},
        ownDrinksNote: (drinks.ownDrinksNote as string | null) ?? null,
      },
      entertainment: {
        items: entertainment.items as EventDetails['entertainment']['items'],
        times: (entertainment.times as EventDetails['entertainment']['times']) ?? {},
        activitiesPreference: (entertainment.activitiesPreference as string | null) ?? null,
      },
      budget: v1 ? (v1Budgets[event.budget as string] ?? null) : (event.budget as number | null),
    },
    estimate: request.estimate ? upgradeEstimate(request.estimate as Loose) : null,
  };
}

function upgradeEstimate(estimate: Loose): Estimate {
  const upgraded: Loose = { bottleLines: [], ...estimate };
  if (typeof estimate.guests === 'number') {
    upgraded.guestsMin = estimate.guests;
    upgraded.guestsMax = estimate.guests;
    delete upgraded.guests;
  }
  return upgraded as unknown as Estimate;
}
