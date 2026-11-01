import { describe, expect, it } from 'vitest';
import { drinksOptions, foodOptions, wizardSteps } from './catalog';
import {
  DRAFT_VERSION,
  canVisit,
  createWizardState,
  endTimes,
  isStepComplete,
  isValidEnd,
  nextStep,
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

const answered = (): WizardState =>
  [
    { type: 'SET_ANSWER', patch: { type: 'wedding' } },
    { type: 'SET_ANSWER', patch: { date: '2027-05-14', startTime: '18:30', endTime: '23:00' } },
    { type: 'SET_ANSWER', patch: { partySize: 'size-40-60' } },
    { type: 'SET_ANSWER', patch: { food: ['dinner'] } },
    { type: 'SET_ANSWER', patch: { drinks: ['wine-only'] } },
    { type: 'SET_ANSWER', patch: { budget: '2500-5000' } },
    { type: 'REACH', step: 'budget' },
  ].reduce(
    (state, action) => wizardReducer(state, action as Parameters<typeof wizardReducer>[1]),
    empty(),
  );

describe('wizardReducer', () => {
  it('keeps earlier answers when a new one arrives', () => {
    const state = wizardReducer(answered(), { type: 'SET_ANSWER', patch: { food: ['lunch'] } });
    expect(state.event.food).toEqual(['lunch']);
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
  it('keeps all ten steps for guests and skips contact once logged in', () => {
    expect(stepsFor(false)).toHaveLength(10);
    expect(stepsFor(true)).toHaveLength(9);
    expect(stepsFor(true)).not.toContain('contact');
  });

  it('walks forward and back', () => {
    expect(nextStep('event-type', false)).toBe('date-time');
    expect(previousStep('date-time', false)).toBe('event-type');
    expect(previousStep('event-type', false)).toBeNull();
  });

  it('ends at contact for guests and at budget when logged in', () => {
    expect(nextStep('budget', false)).toBe('contact');
    expect(nextStep('contact', false)).toBeNull();
    expect(nextStep('budget', true)).toBeNull();
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
    const state = wizardReducer(answered(), { type: 'SET_ANSWER', patch: { food: [] } });
    expect(resumeStep(state, false)).toBe('food');
  });

  it('never lands on contact when it is skipped', () => {
    const state = { ...answered(), furthest: 'contact' as const };
    expect(resumeStep(state, true)).toBe('budget');
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
    const result = toggleOption(drinksOptions, ['wine-only', 'wine-tasting'], 'byo-drinks');
    expect(result.selected).toEqual(['wine-tasting', 'byo-drinks']);
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
