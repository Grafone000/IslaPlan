'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EstimateAmount } from '@/components/estimate/EstimateSummary';
import { useRequestCommand } from '@/components/estimate/useRequestCommand';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { business } from '@/config/business';
import { estimateContent } from '@/content/estimate';
import { budgetBands, itemLabel } from '@/domain/catalog';
import { estimateInputOf } from '@/domain/commands';
import { analyseCostDrivers, type Suggestion } from '@/domain/pricing/drivers';
import { formatMoney } from '@/domain/pricing/format';
import { priceTableV1 } from '@/domain/pricing/table.v1';
import { estimateStage } from '@/domain/request';

const content = estimateContent.revise;

function describe(suggestion: Suggestion): string {
  switch (suggestion.kind) {
    case 'smaller-party':
      return content.smallerParty(suggestion.to);
    case 'swap-item':
      return content.swap(
        itemLabel(suggestion.category, suggestion.from),
        itemLabel(suggestion.category, suggestion.to),
      );
    case 'remove-item':
      return content.remove(itemLabel(suggestion.category, suggestion.item));
  }
}

const stepOf = (suggestion: Suggestion) =>
  suggestion.kind === 'smaller-party' ? 'party-size' : suggestion.category;

const editLink = (step: string) => `/plan/${step}?return=estimate`;

const editableSteps = [
  { id: 'party-size', label: 'Party size' },
  { id: 'food', label: 'Food' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'decorations', label: 'Decorations' },
];

export default function RevisePage() {
  const router = useRouter();
  const wizard = useWizard();
  const { run, busy, error } = useRequestCommand();
  const request = wizard?.state.request ?? null;
  const stage = request ? estimateStage(request) : null;
  const leave = wizard !== null && (stage === null || stage === 'accept' || stage === 'closed');

  useEffect(() => {
    if (leave) {
      router.replace('/plan/estimate');
    }
  }, [leave, router]);

  if (!request?.estimate || leave) {
    return null;
  }

  const { midpoint, drivers, suggestions, budgetGap } = analyseCostDrivers(
    estimateInputOf(request.event),
    request.event.budget,
    priceTableV1,
    business,
  );
  const budgetLabel = budgetBands.find((band) => band.id === budgetGap?.budget)?.label ?? '';

  return (
    <PageShell title={content.title} wide>
      <p className="mt-3 mb-6 text-muted">{content.intro}</p>

      <section className="rounded-button bg-surface p-6">
        <h2 className="mt-0 mb-2 text-base font-semibold">{content.current}</h2>
        <EstimateAmount estimate={request.estimate} />
        {budgetGap && (
          <p className="mt-3 mb-0">
            {budgetGap.difference > 0
              ? content.overBudget(formatMoney(budgetGap.difference), budgetLabel)
              : content.withinBudget(budgetLabel)}
          </p>
        )}
      </section>

      {midpoint !== null && (
        <section className="mt-8">
          <h2 className="mt-0 mb-3 font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-normal">
            {content.drivers}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {drivers.map((driver) => (
              <li key={`${driver.category}-${driver.item}`}>
                <div className="flex justify-between gap-4">
                  <span>{itemLabel(driver.category, driver.item)}</span>
                  <span>
                    {formatMoney(driver.amount)} ({driver.sharePercent}%)
                  </span>
                </div>
                <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-line">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${driver.sharePercent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="mt-8">
          <h2 className="mt-0 mb-3 font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-normal">
            {content.suggestions}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {suggestions.map((suggestion) => (
              <li
                key={describe(suggestion)}
                className="flex flex-col gap-3 rounded-button border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="m-0 font-medium">{describe(suggestion)}</p>
                  <p className="m-0 text-[15px] text-muted">
                    {content.saving(formatMoney(suggestion.saving))}
                  </p>
                </div>
                <Link
                  href={editLink(stepOf(suggestion))}
                  aria-label={`${content.change}: ${describe(suggestion)}`}
                  className="inline-flex min-h-11 shrink-0 items-center font-semibold text-accent"
                >
                  {content.change}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mt-0 mb-2 text-base font-semibold">{content.other}</h2>
        <div className="flex flex-wrap gap-x-5">
          {editableSteps.map((step) => (
            <Link key={step.id} href={editLink(step.id)} className="inline-flex min-h-11 items-center">
              {step.label}
            </Link>
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-4 mb-0 text-[15px] text-accent">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          disabled={busy}
          onClick={async () => {
            if (await run({ type: 'change-event', event: request.event })) {
              router.push('/plan/estimate');
            }
          }}
        >
          {content.keep}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void run({ type: 'decline' })}
        >
          {content.stop}
        </Button>
      </div>
    </PageShell>
  );
}
