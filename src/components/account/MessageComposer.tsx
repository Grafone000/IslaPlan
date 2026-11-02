'use client';

import { useRouter } from 'next/navigation';
import { EmailComposer } from '@/components/messages/EmailComposer';
import { requestsApi } from '@/integrations';

export function MessageComposer({
  requestId,
  to,
  subject,
}: {
  requestId: string;
  to: string;
  subject: string;
}) {
  const router = useRouter();
  return (
    <EmailComposer
      to={to}
      initialSubject={subject}
      onSend={async (message, files) => {
        try {
          await requestsApi.sendMessage(requestId, message, files);
          router.refresh();
          return true;
        } catch {
          return false;
        }
      }}
    />
  );
}
