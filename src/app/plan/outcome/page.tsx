'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent } from '@/content/estimate';
import { estimateStage, type EventRequest } from '@/domain/request';

const content = estimateContent.outcome;

function messageFor(request: EventRequest): string {
  if (request.status === 'deposit-paid') return content.paid;
  const { declinedAt } = request.decisions;
  return declinedAt ? content.declined[declinedAt] : content.inTouch;
}

export default function OutcomePage() {
  const router = useRouter();
  const wizard = useWizard();
  const request = wizard?.state.request ?? null;
  const closed = request !== null && estimateStage(request) === 'closed';
  const leave = wizard !== null && !closed;

  useEffect(() => {
    if (leave) {
      router.replace('/plan/estimate');
    }
  }, [leave, router]);

  if (!request || !closed) {
    return null;
  }

  return (
    <PageShell title={content.title}>
      <p className="mt-4 mb-6">{messageFor(request)}</p>
      <ButtonLink href="/" variant="accent">
        {content.home}
      </ButtonLink>
    </PageShell>
  );
}
