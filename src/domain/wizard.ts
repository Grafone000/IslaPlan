import { wizardSteps, type CatalogOption, type WizardStepId } from './catalog';
import { createDraft, type Contact, type EventDetails, type EventRequest } from './request';
import { isContact } from './validation';

export const DRAFT_VERSION = 1;

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

const stepOrder: readonly WizardStepId[] = wizardSteps.map((step) => step.id);

const indexOf = (step: WizardStepId) => stepOrder.indexOf(step);

export const isWizardStep = (value: string): value is WizardStepId =>
  stepOrder.includes(value as WizardStepId);

export function createWizardState(id: string, at: string): WizardState {
  return {
    draftVersion: DRAFT_VERSION,
    id,
    event: createDraft(id, at).event,
    contact: { firstName: '', lastName: '', email: '', phone: '' },
    furthest: stepOrder[0],
    request: null,
  };
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'LOAD':
      return action.state;
    case 'SET_ANSWER':
      return { ...state, event: { ...state.event, ...action.patch } };
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

export function stepsFor(skipContact: boolean): readonly WizardStepId[] {
  return skipContact ? stepOrder.filter((step) => step !== 'contact') : stepOrder;
}

export function isStepComplete(step: WizardStepId, state: WizardState): boolean {
  const { event, contact } = state;
  switch (step) {
    case 'event-type':
      return event.type !== null;
    case 'date-time':
      return event.date !== null && event.startTime !== null && event.endTime !== null;
    case 'party-size':
      return event.partySize !== null;
    case 'food':
      return event.food.length > 0;
    case 'drinks':
      return event.drinks.length > 0;
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
  const steps = stepsFor(skipContact);
  const limit = Math.min(indexOf(state.furthest), indexOf(steps[steps.length - 1]));
  const missing = steps.find((step) => indexOf(step) < limit && !isStepComplete(step, state));
  return missing ?? stepOrder[limit];
}

export function canVisit(step: WizardStepId, state: WizardState, skipContact: boolean): boolean {
  return indexOf(step) <= indexOf(resumeStep(state, skipContact));
}

export function nextStep(step: WizardStepId, skipContact: boolean): WizardStepId | null {
  const steps = stepsFor(skipContact);
  return steps[steps.indexOf(step) + 1] ?? null;
}

export function previousStep(step: WizardStepId, skipContact: boolean): WizardStepId | null {
  const steps = stepsFor(skipContact);
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

const SLOT_MINUTES = 30;
const FIRST_START = 10 * 60;
const LAST_START = 23 * 60;
const LAST_END = 26 * 60; // 02:00 the next day

const toTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60) % 24;
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function startTimes(): string[] {
  const times: string[] = [];
  for (let minutes = FIRST_START; minutes <= LAST_START; minutes += SLOT_MINUTES) {
    times.push(toTime(minutes));
  }
  return times;
}

export function endTimes(startTime: string): { time: string; endsNextDay: boolean }[] {
  const times: { time: string; endsNextDay: boolean }[] = [];
  const first = toMinutes(startTime) + SLOT_MINUTES;
  for (let minutes = first; minutes <= LAST_END; minutes += SLOT_MINUTES) {
    times.push({ time: toTime(minutes), endsNextDay: minutes >= 24 * 60 });
  }
  return times;
}

export function isValidEnd(
  startTime: string,
  endTime: string | null,
  endsNextDay: boolean,
): boolean {
  return endTimes(startTime).some(
    (slot) => slot.time === endTime && slot.endsNextDay === endsNextDay,
  );
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
