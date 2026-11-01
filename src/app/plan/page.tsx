'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWizard } from '@/components/wizard/WizardProvider';
import { resumeStep } from '@/domain/wizard';

export default function PlanPage() {
  const router = useRouter();
  const wizard = useWizard();

  useEffect(() => {
    if (wizard) {
      router.replace(`/plan/${resumeStep(wizard.state, wizard.account !== null)}`);
    }
  }, [router, wizard]);

  return null;
}
