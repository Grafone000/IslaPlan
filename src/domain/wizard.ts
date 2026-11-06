import {
  isMenuFood,
  isCocktailDrink,
  isPackagedDrink,
  isTimedDrink,
  isTimedEntertainment,
  menuFoods,
  packagedDrinks,
  wizardSteps,
  type CatalogOption,
  type MenuFood,
  type PackagedDrink,
  type WizardStepId,
} from './catalog';
import {
  createDraft,
  type Contact,
  type EventDetails,
  type EventRequest,
  type TimeSlot,
} from './request';
import { hasOverlap, isValidSlot, slotAfter, splitSlot, wholeEventSlot } from './times';
import { isContact } from './validation';

export { endTimes, isValidEnd, startTimes } from './times';

export const DRAFT_VERSION = 3;

export interface WizardState {
  draftVersion: typeof DRAFT_VERSION;
  id: string;
  event: EventDetails;
  contact: Contact;
  furthest: WizardStepId;
  request: EventRequest | null;
}

export type WizardAction =
  | { type: 'LOAD'; state: WizardState }
  | { type: 'SET_ANSWER'; patch: Partial<EventDetails> }
  | { type: 'SET_CONTACT'; contact: Contact }
  | { type: 'REACH'; step: WizardStepId }
  | { type: 'SET_REQUEST'; request: EventRequest }
  | { type: 'RESET'; id: string; at: string };

export const menuStep = (food: MenuFood): WizardStepId => `menu-${food}`;
export const packageStep = (drink: PackagedDrink): WizardStepId => `package-${drink}`;

export function menuFoodOf(step: WizardStepId): MenuFood | null {
  const food = step.startsWith('menu-') ? step.slice('menu-'.length) : '';
  return isMenuFood(food) ? food : null;
}

export function packagedDrinkOf(step: WizardStepId): PackagedDrink | null {
  const drink = step.startsWith('package-') ? step.slice('package-'.length) : '';
  return isPackagedDrink(drink) ? drink : null;
}

// Every step that can exist, in order. The steps a client sees are a subset of it.
const allSteps: readonly WizardStepId[] = wizardSteps.flatMap((step): WizardStepId[] => {
  if (step.id === 'food') return [step.id, ...menuFoods.map(menuStep)];
  if (step.id === 'drinks') return [step.id, ...packagedDrinks.map(packageStep)];
  return [step.id];
});

const indexOf = (step: WizardStepId) => allSteps.indexOf(step);

export const isWizardStep = (value: string): value is WizardStepId =>
  allSteps.includes(value as WizardStepId);

export function createWizardState(id: string, at: string): WizardState {
  return {
    draftVersion: DRAFT_VERSION,
    id,
    event: createDraft(id, at).event,
    contact: { firstName: '', lastName: '', email: '', phone: '' },
    furthest: allSteps[0],
    request: null,
  };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'LOAD':
      return action.state;
    case 'SET_ANSWER':
      return {
        ...state,
        event: normalizeEvent({ ...state.event, ...action.patch }),
      };
    case 'SET_CONTACT':
      return { ...state, contact: action.contact };
    case 'REACH':
      return indexOf(action.step) > indexOf(state.furthest)
        ? { ...state, furthest: action.step }
        : state;
    case 'SET_REQUEST':
      return { ...state, request: action.request };
    case 'RESET':
      return createWizardState(action.id, action.at);
  }
}

function pick<Key extends string, Value>(
  record: Partial<Record<Key, Value>>,
  keys: readonly Key[],
  fill?: (key: Key, value: Value | undefined) => Value | undefined,
): Partial<Record<Key, Value>> {
  const result: Partial<Record<Key, Value>> = {};
  for (const key of keys) {
    const value = fill ? fill(key, record[key]) : record[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// The DJ and live music take turns, so a newly added one starts where the others end.
function entertainmentTimes(event: EventDetails): EventDetails['entertainment']['times'] {
  const { items, times } = event.entertainment;
  const result: EventDetails['entertainment']['times'] = {};
  const kept = items
    .filter(isTimedEntertainment)
    .filter((item) => times[item] && isValidSlot(event, times[item]));
  for (const item of kept) result[item] = times[item];
  const placed = [...kept];
  for (const item of items.filter(isTimedEntertainment)) {
    if (result[item]) continue;
    const free = slotAfter(event, Object.values(result));
    if (free) {
      result[item] = free;
      placed.push(item);
      continue;
    }
    // No time left: the act placed last gives up the second half of its time.
    const last = placed.at(-1);
    const halves = last && result[last] ? splitSlot(result[last]) : null;
    if (last && halves) {
      [result[last], result[item]] = halves;
      placed.push(item);
    } else {
      const whole = wholeEventSlot(event);
      if (whole) result[item] = whole;
    }
  }
  return result;
}

// Keeps the follow-up answers in step with the chosen items: answers for removed items go,
// and every timed drinks service gets the whole event as its slot until the client narrows it.
export function normalizeEvent(event: EventDetails): EventDetails {
  const fitSlot = (_: string, slot: TimeSlot | undefined) =>
    slot && isValidSlot(event, slot) ? slot : (wholeEventSlot(event) ?? undefined);
  const { food, drinks, entertainment } = event;
  const drinksAllBottle = drinks.items.includes('drinks-all') ? drinks.drinksAllBottle : null;
  return {
    ...event,
    food: {
      items: food.items,
      menus: pick(food.menus, food.items.filter(isMenuFood)),
      ownFoodNote: food.items.includes('own-food') ? food.ownFoodNote : null,
    },
    drinks: {
      items: drinks.items,
      packages: pick(drinks.packages, drinks.items.filter(isCocktailDrink)),
      drinksAllBottle,
      wineBottles: drinks.items.includes('wine-only') ? drinks.wineBottles : [],
      times: pick(drinks.times, drinks.items.filter(isTimedDrink), fitSlot),
      ownDrinksNote: drinks.items.includes('byo-drinks') ? drinks.ownDrinksNote : null,
    },
    entertainment: {
      items: entertainment.items,
      times: entertainmentTimes(event),
      activitiesPreference: entertainment.items.includes('activities')
        ? entertainment.activitiesPreference
        : null,
    },
  };
}

export function stepsFor(event: EventDetails, skipContact: boolean): readonly WizardStepId[] {
  return allSteps.filter((step) => {
    if (step === 'contact') return !skipContact;
    const food = menuFoodOf(step);
    if (food) return event.food.items.includes(food);
    const drink = packagedDrinkOf(step);
    if (drink) return event.drinks.items.includes(drink);
    return true;
  });
}

export function isStepComplete(step: WizardStepId, state: WizardState): boolean {
  const { event, contact } = state;
  const food = menuFoodOf(step);
  if (food) return event.food.menus[food] !== undefined;
  const drink = packagedDrinkOf(step);
  if (drink === 'wine-only') return event.drinks.wineBottles.length > 0;
  if (drink === 'drinks-all') {
    return (
      event.drinks.packages['drinks-all'] !== undefined && !!event.drinks.drinksAllBottle?.product
    );
  }
  if (drink) return event.drinks.packages[drink] !== undefined;
  switch (step) {
    case 'event-type':
      return event.type !== null;
    case 'date-time':
      return event.date !== null && event.startTime !== null && event.endTime !== null;
    case 'party-size':
      return event.partySize !== null;
    case 'food':
      return event.food.items.length > 0;
    case 'drinks':
      return event.drinks.items.length > 0;
    case 'entertainment':
      return !hasOverlap(Object.values(event.entertainment.times));
    case 'budget':
      return event.budget !== null;
    case 'contact':
      return isContact(contact);
    default:
      return true;
  }
}

// Where the client may be: the furthest step reached, or an earlier unanswered one.
export function resumeStep(state: WizardState, skipContact: boolean): WizardStepId {
  const steps = stepsFor(state.event, skipContact);
  const limit = Math.min(indexOf(state.furthest), indexOf(steps[steps.length - 1]));
  const missing = steps.find((step) => indexOf(step) < limit && !isStepComplete(step, state));
  return missing ?? steps.find((step) => indexOf(step) >= limit) ?? steps[steps.length - 1];
}

// The first unanswered step, for an edit that started from the estimate.
export function firstIncompleteStep(state: WizardState, skipContact: boolean): WizardStepId | null {
  return stepsFor(state.event, skipContact).find((step) => !isStepComplete(step, state)) ?? null;
}

export function canVisit(step: WizardStepId, state: WizardState, skipContact: boolean): boolean {
  return (
    stepsFor(state.event, skipContact).includes(step) &&
    indexOf(step) <= indexOf(resumeStep(state, skipContact))
  );
}

export function nextStep(
  step: WizardStepId,
  event: EventDetails,
  skipContact: boolean,
): WizardStepId | null {
  const steps = stepsFor(event, skipContact);
  return steps[steps.indexOf(step) + 1] ?? null;
}

export function previousStep(
  step: WizardStepId,
  event: EventDetails,
  skipContact: boolean,
): WizardStepId | null {
  const steps = stepsFor(event, skipContact);
  return steps[steps.indexOf(step) - 1] ?? null;
}

// Picking an option drops whatever it excludes. The dropped options are returned so the
// screen can say why they went away.
export function toggleOption<Id extends string>(
  options: readonly CatalogOption[],
  selected: readonly Id[],
  id: Id,
): { selected: Id[]; removed: CatalogOption[] } {
  if (selected.includes(id)) {
    return { selected: selected.filter((item) => item !== id), removed: [] };
  }
  const excludes = options.find((option) => option.id === id)?.excludes ?? [];
  return {
    selected: [...selected.filter((item) => !excludes.includes(item)), id],
    removed: options.filter((o) => selected.includes(o.id as Id) && excludes.includes(o.id)),
  };
}

export function parseDraft(raw: string | null): WizardState | null {
  if (!raw) {
    return null;
  }
  try {
    const draft = JSON.parse(raw) as Partial<WizardState>;
    return draft.draftVersion === DRAFT_VERSION && typeof draft.id === 'string'
      ? (draft as WizardState)
      : null;
  } catch {
    return null;
  }
}
