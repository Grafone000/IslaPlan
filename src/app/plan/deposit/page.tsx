'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useRequestCommand } from '@/components/estimate/useRequestCommand';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent as content } from '@/content/estimate';
import { formatMoney } from '@/domain/pricing/format';
import { estimateStage } from '@/domain/request';

export default function DepositPage() {
  const router = useRouter();
  const wizard = useWizard();
  const { run, busy, error } = useRequestCommand();
  const request = wizard?.state.request ?? null;
  const stage = request ? estimateStage(request) : null;
  const leave = wizard !== null && stage !== 'deposit';

  useEffect(() => {
    if (leave) {
      router.replace('/plan/estimate');
    }
  }, [leave, router]);

  const amount = request?.estimate?.depositAmount;
  if (!request?.estimate || leave || amount === null || amount === undefined) {
    return null;
  }

  return (
    <PageShell title={content.deposit.title}>
      <p className="mt-3 mb-2 text-muted">{content.deposit.intro(request.estimate.depositPercent)}</p>
      <p className="m-0 font-serif text-[clamp(38px,5vw,56px)] leading-[1.05]">
        {formatMoney(amount)}
      </p>
      {error && (
        <p role="alert" className="mt-4 mb-0 text-[15px] text-accent">
          {error}
        </p>
      )}
      <div className="mt-6">
        <Button variant="outline" disabled={busy} onClick={() => void run({ type: 'decline' })}>
          {content.deposit.notNow}
        </Button>
      </div>
    </PageShell>
  );
}
