'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent as content } from '@/content/estimate';
import { formatMoney } from '@/domain/pricing/format';

export default function EstimatePage() {
  const router = useRouter();
  const wizard = useWizard();
  const estimate = wizard?.state.request?.estimate;
  const missing = wizard !== null && !estimate;

  useEffect(() => {
    if (missing) {
      router.replace('/plan');
    }
  }, [missing, router]);

  if (!estimate) {
    return null;
  }

  return (
    <PageShell title={content.title} wide>
      <p className="mt-3 mb-2 text-muted">{content.indicative}</p>
      {estimate.totalLow !== null && estimate.totalHigh !== null ? (
        <p className="m-0 font-serif text-[clamp(38px,5vw,56px)] leading-[1.05]">
          {formatMoney(estimate.totalLow)} - {formatMoney(estimate.totalHigh)}
        </p>
      ) : (
        <p className="m-0 font-serif text-[clamp(32px,4vw,44px)] leading-[1.1]">
          {content.onRequest}
        </p>
      )}
    </PageShell>
  );
}
