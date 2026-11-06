'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConsultationPanel } from '@/components/estimate/ConsultationPanel';
import { EstimateSummary } from '@/components/estimate/EstimateSummary';
import { EventStory } from '@/components/estimate/EventStory';
import { MagazineCover } from '@/components/estimate/MagazineCover';
import { useRequestCommand } from '@/components/estimate/useRequestCommand';
import { YesNoQuestion } from '@/components/estimate/YesNoQuestion';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent as content } from '@/content/estimate';
import { estimateStage, type EstimateStage } from '@/domain/request';

const redirects: Partial<Record<EstimateStage, string>> = {
  revise: '/plan/revise',
  // Only requests saved before deposits were dropped can still be at this stage.
  deposit: '/plan/deposit',
  closed: '/plan/outcome',
};

const PAGES = 3;
const ESTIMATE_PAGE = PAGES - 1;

export default function EstimatePage() {
  const router = useRouter();
  const wizard = useWizard();
  const { run, busy, error } = useRequestCommand();
  const request = wizard?.state.request ?? null;
  const stage = request ? estimateStage(request) : null;
  const target = stage ? redirects[stage] : wizard ? '/plan' : undefined;
  // The first look at an estimate starts on the cover; any return opens on the numbers.
  const [page, setPage] = useState<number | null>(null);
  const firstLook =
    stage === 'accept' &&
    request?.statusHistory.filter((change) => change.status === 'estimated').length === 1;
  const shown = page ?? (firstLook ? 0 : ESTIMATE_PAGE);

  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [router, target]);

  if (!request?.estimate || !stage || target) {
    return null;
  }

  const turnTo = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <PageShell title={content.magazine.title} wide>
      <p className="mt-2 mb-6 text-[14px] text-muted">{content.magazine.page(shown + 1, PAGES)}</p>

      {/* The key remounts the page, so each turn plays the page-turn animation. */}
      <div key={shown} className="page-turn">
        {shown === 0 && <MagazineCover event={request.event} />}
        {shown === 1 && <EventStory event={request.event} />}
        {shown === ESTIMATE_PAGE && (
          <>
            <p className="m-0 mb-3 text-[12px] tracking-[0.22em] text-muted uppercase">
              {content.magazine.estimateKicker}
            </p>
            <EstimateSummary estimate={request.estimate} event={request.event} />

            {stage === 'accept' && (
              <YesNoQuestion
                question={content.questions.accept}
                disabled={busy}
                onYes={() => void run({ type: 'accept-estimate' })}
                onNo={() => void run({ type: 'reject-estimate' })}
              />
            )}

            {stage === 'consultation' && (
              <YesNoQuestion
                question={content.questions.consultation}
                disabled={busy}
                onYes={() => void run({ type: 'request-consultation' })}
                onNo={() => void run({ type: 'skip-consultation' })}
              />
            )}

            {stage === 'proceed' && (
              <>
                {request.status === 'consultation-requested' && (
                  <ConsultationPanel
                    onCall={() => void run({ type: 'set-consultation-method', method: 'phone' })}
                    onEmail={async () => {
                      if (await run({ type: 'set-consultation-method', method: 'email' })) {
                        router.push('/plan/email');
                      }
                    }}
                  />
                )}
                <YesNoQuestion
                  question={content.questions.proceed}
                  disabled={busy}
                  onYes={() => void run({ type: 'proceed' })}
                  onNo={() => void run({ type: 'decline' })}
                />
              </>
            )}

            {error && (
              <p role="alert" className="mt-4 mb-0 text-[15px] text-accent">
                {error}
              </p>
            )}

            {stage !== 'accept' && (
              <p className="mt-6 mb-0 text-[15px]">
                <Link href="/plan/revise" className="inline-flex min-h-11 items-center">
                  {content.changeChoices}
                </Link>
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        {shown > 0 ? (
          <Button variant="outline" onClick={() => turnTo(shown - 1)}>
            {content.magazine.back}
          </Button>
        ) : (
          <span />
        )}
        {shown < ESTIMATE_PAGE && (
          <Button onClick={() => turnTo(shown + 1)}>{content.magazine.turn}</Button>
        )}
      </div>
    </PageShell>
  );
}
