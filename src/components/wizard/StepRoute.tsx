'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { TextArea } from '@/components/ui/TextArea';
import { wizardContent as content } from '@/content/wizard';
import {
  budgetBands,
  decorationOptions,
  drinksOptions,
  entertainmentOptions,
  eventTypes,
  foodOptions,
  partySizes,
  wizardSteps,
  type BudgetId,
  type EventTypeId,
  type PartySizeId,
  type WizardStepId,
} from '@/domain/catalog';
import { estimateStage, type Contact, type EventDetails } from '@/domain/request';
import {
  canVisit,
  isStepComplete,
  nextStep,
  previousStep,
  resumeStep,
  stepsFor,
} from '@/domain/wizard';
import { requestsApi } from '@/integrations';
import { ContactStep } from './ContactStep';
import { DateTimeStep } from './DateTimeStep';
import { MultiChoiceStep } from './MultiChoiceStep';
import { SingleChoiceStep } from './SingleChoiceStep';
import { useWizard } from './WizardProvider';

const ESTIMATE_PATH = '/plan/estimate';

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
  const step = wizardSteps.find((candidate) => candidate.id === stepId);
  const steps = stepsFor(skipContact);

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
    const merged = { ...event, ...patch };
    dispatch({ type: 'SET_ANSWER', patch });
    const next = nextStep(stepId, skipContact);
    if (returnToEstimate || !next) {
      void submit(merged, account ?? contact);
      return;
    }
    dispatch({ type: 'REACH', step: next });
    router.push(`/plan/${next}`);
  }

  if (!allowed || !step) {
    return null;
  }

  const previous = previousStep(stepId, skipContact);
  const complete = isStepComplete(stepId, state);
  const showContinue = !['single', 'contact'].includes(step.kind) || stepId === 'event-type';
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
        <SingleChoiceStep
          options={partySizes}
          selected={event.partySize}
          onSelect={(partySize) => advance({ partySize: partySize as PartySizeId })}
        />
      )}

      {stepId === 'food' && (
        <MultiChoiceStep
          options={foodOptions}
          selected={event.food}
          onChange={(food) => dispatch({ type: 'SET_ANSWER', patch: { food } })}
        />
      )}

      {stepId === 'drinks' && (
        <MultiChoiceStep
          options={drinksOptions}
          selected={event.drinks}
          onChange={(drinks) => dispatch({ type: 'SET_ANSWER', patch: { drinks } })}
        />
      )}

      {stepId === 'entertainment' && (
        <div className="flex flex-col gap-4">
          <div>
            <MultiChoiceStep
              options={entertainmentOptions}
              selected={event.entertainment.items}
              onChange={(items) =>
                dispatch({
                  type: 'SET_ANSWER',
                  patch: {
                    entertainment: {
                      items,
                      activitiesPreference: items.includes('activities')
                        ? event.entertainment.activitiesPreference
                        : null,
                    },
                  },
                })
              }
            />
          </div>
          {event.entertainment.items.includes('activities') && (
            <TextArea
              label={content.notes.activities}
              value={event.entertainment.activitiesPreference ?? ''}
              onChange={(change) =>
                dispatch({
                  type: 'SET_ANSWER',
                  patch: {
                    entertainment: {
                      ...event.entertainment,
                      activitiesPreference: change.target.value,
                    },
                  },
                })
              }
            />
          )}
        </div>
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
          <SingleChoiceStep
            options={budgetBands}
            selected={event.budget}
            onSelect={(budget) => advance({ budget: budget as BudgetId })}
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
          <Button disabled={!complete || busy} onClick={() => advance()}>
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

function isEmptyOptional(stepId: WizardStepId, event: EventDetails): boolean {
  if (stepId === 'entertainment') return event.entertainment.items.length === 0;
  if (stepId === 'decorations') return event.decorations.items.length === 0;
  return event.additionalInfo.trim() === '';
}
