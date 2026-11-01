import type { ReactNode } from 'react';
import { WizardProvider } from '@/components/wizard/WizardProvider';

export default function PlanLayout({ children }: { children: ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
