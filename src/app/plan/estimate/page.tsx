'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ConsultationPanel } from '@/components/estimate/ConsultationPanel';
import { EstimateSummary } from '@/components/estimate/EstimateSummary';
import { useRequestCommand } from '@/components/estimate/useRequestCommand';
import { YesNoQuestion } from '@/components/estimate/YesNoQuestion';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent as content } from '@/content/estimate';
import { estimateStage, type EstimateStage } from '@/domain/request';

const redirects: Partial<Record<EstimateStage, string>> = {
  revise: '/plan/revise',
  deposit: '/plan/deposit',
  closed: '/plan/outcome',
};

export default function EstimatePage() {
  const router = useRouter();
  const wizard = useWizard();
  const { run, busy, error } = useRequestCommand();
  const request = wizard?.state.request ?? null;
  const stage = request ? estimateStage(request) : null;
  const target = stage ? redirects[stage] : wizard ? '/plan' : undefined;

  useEffect(() => {
    if (target) {
      router.replace(target);
    }
  }, [router, target]);

  if (!request?.estimate || !stage || target) {
    return null;
  }

  return (
    <PageShell title={content.title} wide>
      <div className="mt-6">
        <EstimateSummary estimate={request.estimate} partySize={request.event.partySize ?? ''} />
      </div>

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
    </PageShell>
  );
}
