import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MessageComposer } from '@/components/account/MessageComposer';
import { MessageThread } from '@/components/account/MessageThread';
import { PhotoGallery } from '@/components/account/PhotoGallery';
import { PageShell } from '@/components/ui/PageShell';
import { business } from '@/config/business';
import { accountContent as content } from '@/content/account';
import { eventTypeLabel, partySizeLabel } from '@/domain/catalog';
import { formatEventDate } from '@/domain/dates';
import { formatMoney } from '@/domain/pricing/format';
import { isUuid } from '@/domain/validation';
import { loadAccountEvent } from '@/integrations/accountService';
import { accountServiceDeps, sessionUser } from '@/integrations/server';

const headingClass = 'mt-0 mb-3 font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-normal';

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="m-0 text-right">{value}</dd>
    </div>
  );
}

export default async function AccountEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await sessionUser();
  if (!user) {
    redirect('/login?next=/account');
  }
  const page = isUuid(id) ? await loadAccountEvent(id, user.id, accountServiceDeps()) : null;
  if (!page) {
    notFound();
  }

  const { request, photos, messages } = page;
  const { event, estimate, payment, status } = request;
  const name = eventTypeLabel(event.type);
  const { details } = content;

  return (
    <PageShell title={name} wide>
      <p className="mt-2 mb-0 text-[15px]">
        <Link href="/account" className="inline-flex min-h-11 items-center">
          {content.back}
        </Link>
      </p>

      <section className="mt-6">
        <h2 className={headingClass}>{details.title}</h2>
        <dl className="m-0 flex flex-col gap-2 rounded-button bg-surface p-5">
          <Detail label={details.date} value={formatEventDate(event.date)} />
          <Detail
            label={details.time}
            value={`${event.startTime} - ${event.endTime}${event.endsNextDay ? ` ${details.nextDay}` : ''}`}
          />
          <Detail label={details.partySize} value={partySizeLabel(event.partySize ?? '')} />
          <Detail label={details.status} value={content.statuses[status]} />
          <Detail
            label={details.estimate}
            value={
              estimate?.totalLow != null && estimate.totalHigh != null
                ? `${formatMoney(estimate.totalLow)} - ${formatMoney(estimate.totalHigh)}`
                : details.onRequest
            }
          />
          {payment?.status === 'paid' && (
            <Detail label={details.deposit} value={formatMoney(payment.amount)} />
          )}
        </dl>
      </section>

      {photos.length > 0 && (
        <section className="mt-10">
          <h2 className={headingClass}>{content.photos.title}</h2>
          <PhotoGallery photos={photos} />
        </section>
      )}

      <section className="mt-10">
        <h2 className={headingClass}>{content.messages.title}</h2>
        <MessageThread messages={messages} />
      </section>

      <section className="mt-10">
        <h2 className={headingClass}>{content.messages.write}</h2>
        <MessageComposer
          key={messages.length}
          requestId={id}
          to={business.contactEmail}
          subject={content.messages.subject(name)}
        />
      </section>
    </PageShell>
  );
}
