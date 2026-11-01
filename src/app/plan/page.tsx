'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateStage } from '@/domain/request';
import { resumeStep } from '@/domain/wizard';

export default function PlanPage() {
  const router = useRouter();
  const wizard = useWizard();

  useEffect(() => {
    if (!wizard) {
      return;
    }
    const { state, dispatch, account } = wizard;
    // A finished request stays on record; the next visit plans a new event.
    if (state.request && estimateStage(state.request) === 'closed') {
      dispatch({ type: 'RESET', id: crypto.randomUUID(), at: new Date().toISOString() });
      return;
    }
    router.replace(`/plan/${resumeStep(state, account !== null)}`);
  }, [router, wizard]);

  return null;
}
