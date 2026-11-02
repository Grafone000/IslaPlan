import { format } from 'date-fns';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageShell } from '@/components/ui/PageShell';
import { accountContent as content } from '@/content/account';
import { splitEvents } from '@/domain/account';
import { eventTypeLabel } from '@/domain/catalog';
import { formatEventDate } from '@/domain/dates';
import type { EventRequest } from '@/domain/request';
import { accountServiceDeps, sessionUser } from '@/integrations/server';

function EventList({ events, empty }: { events: EventRequest[]; empty: string }) {
  if (events.length === 0) {
    return <p className="m-0 text-muted">{empty}</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {events.map((event) => {
        const name = eventTypeLabel(event.event.type);
        return (
          <li key={event.id}>
            <Link
              href={`/account/events/${event.id}`}
              aria-label={content.viewEvent(`${name}, ${formatEventDate(event.event.date)}`)}
              className="flex min-h-14 items-center justify-between gap-4 rounded-button border border-line bg-white p-4 no-underline"
            >
              <span>
                <span className="block font-medium">{name}</span>
                <span className="block text-[15px] text-muted">
                  {formatEventDate(event.event.date)}
                </span>
              </span>
              <span className="text-right text-[15px] text-muted">
                {content.statuses[event.status]}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function AccountPage() {
  const user = await sessionUser();
  if (!user) {
    redirect('/login?next=/account');
  }

  const requests = await accountServiceDeps().requests.listByAccount(user.id);
  const { upcoming, past } = splitEvents(requests, format(new Date(), 'yyyy-MM-dd'));
  const headingClass =
    'mt-0 mb-3 font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-normal';

  return (
    <PageShell title={content.title} wide>
      <div className="mt-5">
        <ButtonLink href="/plan" variant="accent">
          {content.createEvent}
        </ButtonLink>
      </div>
      <section className="mt-10">
        <h2 className={headingClass}>{content.upcoming}</h2>
        <EventList events={upcoming} empty={content.noUpcoming} />
      </section>
      <section className="mt-10">
        <h2 className={headingClass}>{content.past}</h2>
        <EventList events={past} empty={content.noPast} />
      </section>
    </PageShell>
  );
}
