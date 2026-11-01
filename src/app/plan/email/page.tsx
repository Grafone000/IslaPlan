'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EmailComposer } from '@/components/messages/EmailComposer';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { business } from '@/config/business';
import { composerContent as content } from '@/content/composer';
import { requestsApi } from '@/integrations';

export default function EmailPage() {
  const router = useRouter();
  const wizard = useWizard();
  const request = wizard?.state.request ?? null;
  const allowed = request?.status === 'consultation-requested';
  const leave = wizard !== null && !allowed;

  useEffect(() => {
    if (leave) {
      router.replace('/plan/estimate');
    }
  }, [leave, router]);

  if (!wizard || !allowed) {
    return null;
  }

  return (
    <PageShell title={content.title} wide>
      <div className="mt-6">
        <EmailComposer
          to={business.contactEmail}
          onSend={async (message, files) => {
            try {
              const updated = await requestsApi.sendMessage(wizard.state.id, message, files);
              wizard.dispatch({ type: 'SET_REQUEST', request: updated });
              router.push('/plan/estimate');
              return true;
            } catch {
              return false;
            }
          }}
        />
      </div>
      <p className="mt-5 mb-0 text-[15px]">
        <Link href="/plan/estimate" className="inline-flex min-h-11 items-center">
          {content.back}
        </Link>
      </p>
    </PageShell>
  );
}
