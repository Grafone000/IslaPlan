'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { TextArea } from '@/components/ui/TextArea';
import { wizardContent as content } from '@/content/wizard';
import {
  budgetLimits,
  decorationOptions,
  drinkPackages,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodMenus,
  foodOptions,
  guestLimits,
  isTimedDrink,
  isTimedEntertainment,
  itemLabel,
  wizardSteps,
  type DrinksId,
  type EntertainmentId,
  type EventTypeId,
  type FoodId,
  type StepKind,
  type WizardStepId,
} from '@/domain/catalog';
import { formatMoney } from '@/domain/pricing/format';
import { estimateStage, type Contact, type EventDetails, type TimeSlot } from '@/domain/request';
import {
  canVisit,
  firstIncompleteStep,
  isStepComplete,
  menuFoodOf,
  nextStep,
  normalizeEvent,
  packagedDrinkOf,
  previousStep,
  resumeStep,
  stepsFor,
} from '@/domain/wizard';
import { requestsApi } from '@/integrations';
import { ContactStep } from './ContactStep';
import { DateTimeStep } from './DateTimeStep';
import { MenuStep } from './MenuStep';
import { MultiChoiceStep } from './MultiChoiceStep';
import { SingleChoiceStep } from './SingleChoiceStep';
import { SliderStep } from './SliderStep';
import { TimeSlotFields } from './TimeSlotFields';
import { useWizard } from './WizardProvider';

const ESTIMATE_PATH = '/plan/estimate';

interface StepInfo {
  title: string;
  kind: StepKind;
  required: boolean;
}

function stepInfo(stepId: WizardStepId): StepInfo | null {
  const food = menuFoodOf(stepId);
  if (food) return { title: content.menuTitles[food], kind: 'menu', required: true };
  const drink = packagedDrinkOf(stepId);
  if (drink)
    return {
      title: content.packageTitles[drink],
      kind: 'package',
      required: true,
    };
  return wizardSteps.find((candidate) => candidate.id === stepId) ?? null;
}

const formatGuests = (guests: number) => content.sliders.guestsValue(guests);
const formatBudget = (budget: number) =>
  content.sliders.budgetValue(formatMoney(budget), budget >= budgetLimits.maxMinor);

export function StepRoute({
  stepId,
  returnToEstimate,
}: {
  stepId: WizardStepId;
  returnToEstimate: boolean;
}) {
  const wizard = useWizard();
  if (!wizard) {
    return null;
  }
  return <Step wizard={wizard} stepId={stepId} returnToEstimate={returnToEstimate} />;
}

function Step({
  wizard,
  stepId,
  returnToEstimate,
}: {
  wizard: NonNullable<ReturnType<typeof useWizard>>;
  stepId: WizardStepId;
  returnToEstimate: boolean;
}) {
  const router = useRouter();
  const { state, dispatch, account } = wizard;
  const { event, contact, request, id } = state;
  const skipContact = account !== null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSubmitted = useRef(false);

  const closed = request !== null && estimateStage(request) === 'closed';
  const allowed = !closed && canVisit(stepId, state, skipContact);
  const step = stepInfo(stepId);
  const steps = stepsFor(event, skipContact);

  useEffect(() => {
    if (closed) {
      router.replace('/plan');
    } else if (!allowed) {
      router.replace(`/plan/${resumeStep(state, skipContact)}`);
    }
  }, [allowed, closed, router, skipContact, state]);

  async function submit(finalEvent: EventDetails, finalContact: Contact) {
    setBusy(true);
    setError(null);
    try {
      const unchanged = request && JSON.stringify(request.event) === JSON.stringify(finalEvent);
      if (!unchanged) {
        const saved = request
          ? await requestsApi.command(id, { type: 'change-event', event: finalEvent })
          : await requestsApi.create({ id, contact: finalContact, event: finalEvent });
        dispatch({ type: 'SET_REQUEST', request: saved });
      }
      router.push(ESTIMATE_PATH);
    } catch {
      setError(content.saveError);
      setBusy(false);
    }
  }

  // Coming back from the login page: the account now supplies the contact details.
  useEffect(() => {
    if (stepId === 'contact' && account && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit(event, account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, account]);

  function advance(patch: Partial<EventDetails> = {}) {
    const merged = normalizeEvent({ ...event, ...patch });
    dispatch({ type: 'SET_ANSWER', patch });
    if (returnToEstimate) {
      // An edit can add a menu or package question: ask it before going back to the estimate.
      const missing = firstIncompleteStep({ ...state, event: merged }, skipContact);
      if (missing && missing !== stepId) {
        router.push(`/plan/${missing}?return=estimate`);
      } else {
        void submit(merged, account ?? contact);
      }
      return;
    }
    const next = nextStep(stepId, merged, skipContact);
    if (!next) {
      void submit(merged, account ?? contact);
      return;
    }
    dispatch({ type: 'REACH', step: next });
    router.push(`/plan/${next}`);
  }

  const setFood = (food: Partial<EventDetails['food']>) =>
    dispatch({
      type: 'SET_ANSWER',
      patch: { food: { ...event.food, ...food } },
    });
  const setDrinks = (drinks: Partial<EventDetails['drinks']>) =>
    dispatch({
      type: 'SET_ANSWER',
      patch: { drinks: { ...event.drinks, ...drinks } },
    });
  const setEntertainment = (entertainment: Partial<EventDetails['entertainment']>) =>
    dispatch({
      type: 'SET_ANSWER',
      patch: { entertainment: { ...event.entertainment, ...entertainment } },
    });

  function slotFields(
    label: string,
    slot: TimeSlot | undefined,
    onChange: (slot: TimeSlot) => void,
  ) {
    return slot ? (
      <TimeSlotFields label={label} event={event} slot={slot} onChange={onChange} />
    ) : null;
  }

  function drinkDetail(id: DrinksId) {
    if (isTimedDrink(id)) {
      return slotFields(itemLabel('drinks', id), event.drinks.times[id], (slot) =>
        setDrinks({ times: { ...event.drinks.times, [id]: slot } }),
      );
    }
    if (id === 'byo-drinks') {
      return (
        <TextArea
          label={content.notes.ownDrinks}
          rows={2}
          value={event.drinks.ownDrinksNote ?? ''}
          onChange={(change) => setDrinks({ ownDrinksNote: change.target.value })}
        />
      );
    }
    return null;
  }

  function entertainmentDetail(id: EntertainmentId) {
    if (isTimedEntertainment(id)) {
      return slotFields(itemLabel('entertainment', id), event.entertainment.times[id], (slot) =>
        setEntertainment({
          times: { ...event.entertainment.times, [id]: slot },
        }),
      );
    }
    if (id === 'activities') {
      return (
        <TextArea
          label={content.notes.activities}
          value={event.entertainment.activitiesPreference ?? ''}
          onChange={(change) => setEntertainment({ activitiesPreference: change.target.value })}
        />
      );
    }
    return null;
  }

  const menuFood = menuFoodOf(stepId);
  const packagedDrink = packagedDrinkOf(stepId);

  if (!allowed || !step) {
    return null;
  }

  const previous = previousStep(stepId, event, skipContact);
  // A slider always has a value: the client may keep the one it starts on.
  const complete = step.kind === 'slider' || isStepComplete(stepId, state);
  const showContinue =
    !['single', 'contact', 'menu', 'package'].includes(step.kind) || stepId === 'event-type';
  const eventNeedsNote = event.type === 'other-bespoke';

  return (
    <PageShell title={step.title} wide>
      <p className="mt-2 mb-6 text-[15px] text-muted">
        {content.progress(steps.indexOf(stepId) + 1, steps.length)}
      </p>

      {stepId === 'event-type' && (
        <div className="flex flex-col gap-4">
          <SingleChoiceStep
            options={eventTypes}
            selected={event.type}
            onSelect={(type) => {
              if (type === 'other-bespoke') {
                dispatch({ type: 'SET_ANSWER', patch: { type } });
              } else {
                advance({ type: type as EventTypeId, typeNote: null });
              }
            }}
          />
          {eventNeedsNote && (
            <TextArea
              label={content.notes.eventType}
              value={event.typeNote ?? ''}
              onChange={(change) =>
                dispatch({ type: 'SET_ANSWER', patch: { typeNote: change.target.value } })
              }
            />
          )}
        </div>
      )}

      {stepId === 'date-time' && (
        <DateTimeStep
          event={event}
          onChange={(patch) => dispatch({ type: 'SET_ANSWER', patch })}
        />
      )}

      {stepId === 'party-size' && (
        <>
          <p className="mt-0 mb-4 text-muted">{content.hints.guests}</p>
          <SliderStep
            label={content.sliders.guests}
            min={guestLimits.min}
            max={guestLimits.max}
            step={guestLimits.step}
            value={event.guests ?? guestLimits.initial}
            format={formatGuests}
            onChange={(guests) => dispatch({ type: 'SET_ANSWER', patch: { guests } })}
          />
        </>
      )}

      {stepId === 'food' && (
        <MultiChoiceStep<FoodId>
          options={foodOptions}
          selected={event.food.items}
          onChange={(items) => setFood({ items })}
          renderDetail={(id) =>
            id === 'own-food' ? (
              <TextArea
                label={content.notes.ownFood}
                rows={2}
                value={event.food.ownFoodNote ?? ''}
                onChange={(change) => setFood({ ownFoodNote: change.target.value })}
              />
            ) : null
          }
        />
      )}

      {menuFood && (
        <>
          <p className="mt-0 mb-4 text-muted">{content.hints.menu}</p>
          <MenuStep
            menus={foodMenus[menuFood]}
            selected={event.food.menus[menuFood]}
            onSelect={(menu) =>
              advance({
                food: {
                  ...event.food,
                  menus: { ...event.food.menus, [menuFood]: menu },
                },
              })
            }
          />
        </>
      )}

      {stepId === 'drinks' && (
        <MultiChoiceStep<DrinksId>
          options={drinksOptions}
          selected={event.drinks.items}
          onChange={(items) => setDrinks({ items })}
          renderDetail={drinkDetail}
        />
      )}

      {packagedDrink && (
        <>
          <p className="mt-0 mb-4 text-muted">{content.hints.package}</p>
          <SingleChoiceStep
            options={drinkPackages[packagedDrink]}
            selected={event.drinks.packages[packagedDrink] ?? null}
            onSelect={(option) =>
              advance({
                drinks: {
                  ...event.drinks,
                  packages: {
                    ...event.drinks.packages,
                    [packagedDrink]: option,
                  },
                },
              })
            }
          />
        </>
      )}

      {stepId === 'entertainment' && (
        <MultiChoiceStep<EntertainmentId>
          options={entertainmentOptions}
          selected={event.entertainment.items}
          onChange={(items) => setEntertainment({ items })}
          renderDetail={entertainmentDetail}
        />
      )}

      {stepId === 'decorations' && (
        <div className="flex flex-col gap-4">
          <div>
            <MultiChoiceStep
              options={decorationOptions}
              selected={event.decorations.items}
              onChange={(items) =>
                dispatch({
                  type: 'SET_ANSWER',
                  patch: {
                    decorations: {
                      items,
                      note: items.includes('other-bespoke') ? event.decorations.note : null,
                    },
                  },
                })
              }
            />
          </div>
          {event.decorations.items.includes('other-bespoke') && (
            <TextArea
              label={content.notes.decorations}
              value={event.decorations.note ?? ''}
              onChange={(change) =>
                dispatch({
                  type: 'SET_ANSWER',
                  patch: { decorations: { ...event.decorations, note: change.target.value } },
                })
              }
            />
          )}
        </div>
      )}

      {stepId === 'additional-info' && (
        <TextArea
          label={content.notes.additional}
          value={event.additionalInfo}
          onChange={(change) =>
            dispatch({ type: 'SET_ANSWER', patch: { additionalInfo: change.target.value } })
          }
        />
      )}

      {stepId === 'budget' && (
        <>
          <p className="mt-0 mb-4 text-muted">{content.hints.budget}</p>
          <SliderStep
            label={content.sliders.budget}
            min={budgetLimits.minMinor}
            max={budgetLimits.maxMinor}
            step={budgetLimits.stepMinor}
            value={event.budget ?? budgetLimits.initialMinor}
            format={formatBudget}
            onChange={(budget) => dispatch({ type: 'SET_ANSWER', patch: { budget } })}
          />
        </>
      )}

      {stepId === 'contact' && !account && (
        <ContactStep
          contact={contact}
          busy={busy}
          onChange={(next) => dispatch({ type: 'SET_CONTACT', contact: next })}
          onSubmit={() => void submit(event, contact)}
        />
      )}

      {busy && stepId !== 'contact' && (
        <p role="status" className="mt-4 mb-0 text-[15px]">
          {content.saving}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 mb-0 text-[15px] text-accent">
          {error}
        </p>
      )}

      {showContinue && (stepId !== 'event-type' || eventNeedsNote) && (
        <div className="mt-6">
          <Button disabled={!complete || busy} onClick={() => advance(sliderValue(stepId, event))}>
            {!step.required && isEmptyOptional(stepId, event)
              ? content.actions.skip
              : content.actions.continue}
          </Button>
        </div>
      )}

      {!busy && (
        <p className="mt-5 mb-0 text-[15px]">
          <Link
            href={
              returnToEstimate
                ? ESTIMATE_PATH
                : previous
                  ? `/plan/${previous}`
                  : '/'
            }
            className="inline-flex min-h-11 items-center"
          >
            {content.actions.back}
          </Link>
        </p>
      )}
    </PageShell>
  );
}

// The value a slider shows before the client moves it still has to be saved.
function sliderValue(stepId: WizardStepId, event: EventDetails): Partial<EventDetails> {
  if (stepId === 'party-size') return { guests: event.guests ?? guestLimits.initial };
  if (stepId === 'budget') return { budget: event.budget ?? budgetLimits.initialMinor };
  return {};
}

function isEmptyOptional(stepId: WizardStepId, event: EventDetails): boolean {
  if (stepId === 'entertainment') return event.entertainment.items.length === 0;
  if (stepId === 'decorations') return event.decorations.items.length === 0;
  return event.additionalInfo.trim() === '';
}
