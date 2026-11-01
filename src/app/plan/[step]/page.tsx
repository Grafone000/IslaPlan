import { notFound } from 'next/navigation';
import { StepRoute } from '@/components/wizard/StepRoute';
import { isWizardStep } from '@/domain/wizard';

export default async function StepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { step } = await params;
  const { return: returnTo } = await searchParams;
  if (!isWizardStep(step)) {
    notFound();
  }
  return <StepRoute stepId={step} returnToEstimate={returnTo === 'estimate'} />;
}
