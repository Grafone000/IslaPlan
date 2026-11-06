import { describe, expect, it } from 'vitest';
import { drinksOptions, foodOptions, wizardSteps, type DrinksId, type FoodId } from './catalog';
import {
  DRAFT_VERSION,
  canVisit,
  createWizardState,
  endTimes,
  firstIncompleteStep,
  isStepComplete,
  isValidEnd,
  isWizardStep,
  nextStep,
  normalizeEvent,
  parseDraft,
  previousStep,
  resumeStep,
  startTimes,
  stepsFor,
  toggleOption,
  wizardReducer,
  type WizardState,
} from './wizard';

const T0 = '2026-11-01T10:00:00.000Z';
const empty = () => createWizardState('id', T0);

const food = (items: FoodId[], menus = {}) => ({ items, menus, ownFoodNote: null });
const houseRed = { product: 'house-red', glass: 'glass-150' as const, quantity: 10 };
const drinks = (items: DrinksId[], wineBottles = items.includes('wine-only') ? [houseRed] : []) => ({
  items,
  packages: {},
  drinksAllBottle: null,
  wineBottles,
  times: {},
  ownDrinksNote: null,
});

const answered = (): WizardState =>
  [
    { type: 'SET_ANSWER', patch: { type: 'wedding' } },
    { type: 'SET_ANSWER', patch: { date: '2027-05-14', startTime: '18:30', endTime: '23:00' } },
    { type: 'SET_ANSWER', patch: { partySize: 'size-40-60' } },
    { type: 'SET_ANSWER', patch: { food: food(['dinner']) } },
    { type: 'SET_ANSWER', patch: { drinks: drinks(['wine-only']) } },
    { type: 'SET_ANSWER', patch: { budget: 500_000 } },
    { type: 'REACH', step: 'budget' },
  ].reduce(
    (state, action) => wizardReducer(state, action as Parameters<typeof wizardReducer>[1]),
    empty(),
  );

const withAnswer = (state: WizardState, patch: Partial<WizardState['event']>) =>
  wizardReducer(state, { type: 'SET_ANSWER', patch });

describe('wizardReducer', () => {
  it('keeps earlier answers when a new one arrives', () => {
    const state = withAnswer(answered(), { food: food(['lunch']) });
    expect(state.event.food.items).toEqual(['lunch']);
    expect(state.event.type).toBe('wedding');
  });

  it('only moves furthest forward', () => {
    const state = wizardReducer(answered(), { type: 'REACH', step: 'food' });
    expect(state.furthest).toBe('budget');
  });

  it('starts over on reset', () => {
    const state = wizardReducer(answered(), { type: 'RESET', id: 'new', at: T0 });
    expect(state.id).toBe('new');
    expect(state.event.type).toBeNull();
    expect(state.furthest).toBe('event-type');
  });
});

describe('step order', () => {
  const event = empty().event;

  it('keeps all ten steps for guests and skips contact once logged in', () => {
    expect(stepsFor(event, false)).toHaveLength(10);
    expect(stepsFor(event, true)).toHaveLength(9);
    expect(stepsFor(event, true)).not.toContain('contact');
  });

  it('walks forward and back', () => {
    expect(nextStep('event-type', event, false)).toBe('date-time');
    expect(previousStep('date-time', event, false)).toBe('event-type');
    expect(previousStep('event-type', event, false)).toBeNull();
  });

  it('ends at contact for guests and at budget when logged in', () => {
    expect(nextStep('budget', event, false)).toBe('contact');
    expect(nextStep('contact', event, false)).toBeNull();
    expect(nextStep('budget', event, true)).toBeNull();
  });

  it('adds a page per chosen menu food and drinks package, in catalogue order', () => {
    const chosen = {
      ...event,
      food: food(['private-chef', 'brunch', 'dinner', 'own-food']),
      drinks: drinks(['wine-only', 'cocktails-spirits-only', 'private-bartender']),
    };
    expect(stepsFor(chosen, false).slice(3, 9)).toEqual([
      'food',
      'menu-brunch',
      'menu-private-chef',
      'drinks',
      'package-cocktails-spirits-only',
      'package-wine-only',
    ]);
    expect(nextStep('food', chosen, false)).toBe('menu-brunch');
    expect(previousStep('drinks', chosen, false)).toBe('menu-private-chef');
  });

  it('knows every menu and package page', () => {
    expect(isWizardStep('menu-lunch')).toBe(true);
    expect(isWizardStep('package-drinks-all')).toBe(true);
    expect(isWizardStep('menu-dinner')).toBe(false);
  });
});

describe('drinks pages', () => {
  it('need bottles for Wine only, and a package and a bottle for Drinks all', () => {
    const noBottles = withAnswer(answered(), { drinks: drinks(['wine-only'], []) });
    expect(isStepComplete('package-wine-only', noBottles)).toBe(false);
    expect(isStepComplete('package-wine-only', answered())).toBe(true);

    const drinksAll = withAnswer(answered(), {
      drinks: { ...drinks(['drinks-all']), packages: { 'drinks-all': 'four-cocktails-bottle' } },
    });
    expect(isStepComplete('package-drinks-all', drinksAll)).toBe(false);
    const withBottle = withAnswer(drinksAll, {
      drinks: { ...drinksAll.event.drinks, drinksAllBottle: { kind: 'wine', product: 'house-red' } },
    });
    expect(isStepComplete('package-drinks-all', withBottle)).toBe(true);
  });

  it('drop the bottles of a drink that is no longer chosen', () => {
    const state = withAnswer(answered(), { drinks: { ...answered().event.drinks, items: ['byo-drinks'] } });
    expect(state.event.drinks.wineBottles).toEqual([]);
  });
});

describe('entertainment times', () => {
  it('start the second timed act where the first ends, so they do not overlap', () => {
    const dj = { startTime: '18:30', startsNextDay: false, endTime: '21:00', endsNextDay: false };
    const state = withAnswer(answered(), {
      entertainment: { items: ['dj', 'live-music'], times: { dj }, activitiesPreference: null },
    });
    expect(state.event.entertainment.times['live-music']).toEqual({
      startTime: '21:00',
      startsNextDay: false,
      endTime: '23:00',
      endsNextDay: false,
    });
    expect(isStepComplete('entertainment', state)).toBe(true);
  });

  it('share the event in two halves when the first act takes it all', () => {
    const withDj = withAnswer(answered(), {
      entertainment: { items: ['dj'], times: {}, activitiesPreference: null },
    });
    const state = withAnswer(withDj, {
      entertainment: { ...withDj.event.entertainment, items: ['dj', 'live-music'] },
    });
    expect(state.event.entertainment.times.dj).toMatchObject({ startTime: '18:30', endTime: '20:30' });
    expect(state.event.entertainment.times['live-music']).toMatchObject({
      startTime: '20:30',
      endTime: '23:00',
    });
    expect(isStepComplete('entertainment', state)).toBe(true);
  });

  it('block the step while two acts overlap', () => {
    const slot = { startTime: '19:00', startsNextDay: false, endTime: '22:00', endsNextDay: false };
    const state = withAnswer(answered(), {
      entertainment: {
        items: ['dj', 'live-music'],
        times: { dj: slot, 'live-music': { ...slot, startTime: '21:00', endTime: '23:00' } },
        activitiesPreference: null,
      },
    });
    expect(isStepComplete('entertainment', state)).toBe(false);
  });
});

describe('normalizeEvent', () => {
  it('gives each timed service the whole event until the client narrows it', () => {
    const state = withAnswer(answered(), {
      drinks: drinks(['wine-only', 'private-bartender']),
    });
    expect(state.event.drinks.times['private-bartender']).toEqual({
      startTime: '18:30',
      startsNextDay: false,
      endTime: '23:00',
      endsNextDay: false,
    });
  });

  it('drops the follow-up answers of items that are no longer chosen', () => {
    const chosen = withAnswer(answered(), {
      food: { items: ['lunch', 'own-food'], menus: { lunch: 'copper-fork' }, ownFoodNote: 'Cake' },
    });
    const state = withAnswer(chosen, { food: { ...chosen.event.food, items: ['dinner'] } });
    expect(state.event.food).toEqual(food(['dinner']));
  });

  it('refits a service slot that falls outside new event hours', () => {
    const late = { startTime: '22:00', startsNextDay: false, endTime: '23:00', endsNextDay: false };
    const event = normalizeEvent({
      ...answered().event,
      entertainment: { items: ['dj'], times: { dj: late }, activitiesPreference: null },
    });
    const earlier = normalizeEvent({ ...event, startTime: '12:00', endTime: '16:00' });
    expect(earlier.entertainment.times.dj).toMatchObject({ startTime: '12:00', endTime: '16:00' });
  });
});

describe('isStepComplete', () => {
  it('needs an answer on required steps', () => {
    for (const step of wizardSteps.filter((s) => s.required)) {
      expect(isStepComplete(step.id, empty()), step.id).toBe(false);
    }
  });

  it('lets optional steps stay empty', () => {
    for (const step of wizardSteps.filter((s) => !s.required)) {
      expect(isStepComplete(step.id, empty()), step.id).toBe(true);
    }
  });
});

describe('resumeStep', () => {
  it('starts at the first step', () => {
    expect(resumeStep(empty(), false)).toBe('event-type');
  });

  it('returns to the furthest step, not past optional ones', () => {
    const state = { ...answered(), furthest: 'entertainment' as const };
    expect(resumeStep(state, false)).toBe('entertainment');
  });

  it('goes back to an unanswered required step', () => {
    const state = withAnswer(answered(), { food: food([]) });
    expect(resumeStep(state, false)).toBe('food');
  });

  it('goes back to a menu that has not been chosen', () => {
    const state = withAnswer(answered(), { food: food(['brunch']) });
    expect(resumeStep(state, false)).toBe('menu-brunch');
  });

  it('never lands on contact when it is skipped', () => {
    const state = { ...answered(), furthest: 'contact' as const };
    expect(resumeStep(state, true)).toBe('budget');
  });
});

describe('firstIncompleteStep', () => {
  it('finds a new menu question after an edit', () => {
    const state = withAnswer(answered(), { food: food(['dinner', 'canapes']) });
    expect(firstIncompleteStep(state, true)).toBe('menu-canapes');
  });

  it('is null when every answer is in', () => {
    expect(firstIncompleteStep(answered(), true)).toBeNull();
  });
});

describe('canVisit', () => {
  it('blocks steps past the resume point', () => {
    expect(canVisit('event-type', empty(), false)).toBe(true);
    expect(canVisit('budget', empty(), false)).toBe(false);
  });

  it('allows going back to earlier steps', () => {
    expect(canVisit('food', answered(), false)).toBe(true);
  });

  it('blocks the page of a food that is not chosen', () => {
    expect(canVisit('menu-lunch', answered(), false)).toBe(false);
  });
});

describe('toggleOption', () => {
  it('adds and removes an option', () => {
    expect(toggleOption(foodOptions, ['lunch'], 'canapes').selected).toEqual(['lunch', 'canapes']);
    expect(toggleOption(foodOptions, ['lunch', 'canapes'], 'lunch').selected).toEqual(['canapes']);
  });

  it('drops Lunch and Dinner when Private chef is picked', () => {
    const result = toggleOption(foodOptions, ['lunch', 'dinner', 'canapes'], 'private-chef');
    expect(result.selected).toEqual(['canapes', 'private-chef']);
    expect(result.removed.map((option) => option.label)).toEqual(['Lunch', 'Dinner']);
  });

  it('drops Private chef when Dinner is picked', () => {
    const result = toggleOption(foodOptions, ['private-chef'], 'dinner');
    expect(result.selected).toEqual(['dinner']);
    expect(result.removed.map((option) => option.label)).toEqual(['Private chef']);
  });

  it('keeps drinks supply options exclusive but allows extras', () => {
    const result = toggleOption(drinksOptions, ['wine-only', 'private-bartender'], 'byo-drinks');
    expect(result.selected).toEqual(['private-bartender', 'byo-drinks']);
  });

  it('lets Wine only and Cocktails/spirits only go together, but not with Drinks all', () => {
    expect(toggleOption(drinksOptions, ['wine-only'], 'cocktails-spirits-only').selected).toEqual([
      'wine-only',
      'cocktails-spirits-only',
    ]);
    expect(
      toggleOption(drinksOptions, ['wine-only', 'cocktails-spirits-only'], 'drinks-all').selected,
    ).toEqual(['drinks-all']);
  });
});

describe('time slots', () => {
  it('offers starts from 10:00 to 23:00 every 30 minutes', () => {
    const times = startTimes();
    expect(times[0]).toBe('10:00');
    expect(times[1]).toBe('10:30');
    expect(times.at(-1)).toBe('23:00');
    expect(times).toHaveLength(27);
  });

  it('offers ends after the start, up to 02:00 the next day', () => {
    const slots = endTimes('23:00');
    expect(slots[0]).toEqual({ time: '23:30', endsNextDay: false });
    expect(slots[1]).toEqual({ time: '00:00', endsNextDay: true });
    expect(slots.at(-1)).toEqual({ time: '02:00', endsNextDay: true });
  });

  it('checks an end against the start', () => {
    expect(isValidEnd('18:00', '23:00', false)).toBe(true);
    expect(isValidEnd('18:00', '01:00', true)).toBe(true);
    expect(isValidEnd('18:00', '17:00', false)).toBe(false);
    expect(isValidEnd('18:00', null, false)).toBe(false);
  });
});

describe('parseDraft', () => {
  it('restores a saved draft', () => {
    const state = answered();
    expect(parseDraft(JSON.stringify(state))).toEqual(state);
  });

  it.each([
    ['nothing saved', null],
    ['broken JSON', '{nope'],
    ['another version', JSON.stringify({ draftVersion: DRAFT_VERSION + 1, id: 'id' })],
    ['no id', JSON.stringify({ draftVersion: DRAFT_VERSION })],
  ])('ignores %s', (_name, raw) => {
    expect(parseDraft(raw)).toBeNull();
  });
});
