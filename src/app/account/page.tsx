import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteMenu } from '@/components/home/SiteMenu';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { accountContent as content } from '@/content/account';
import { estimateContent } from '@/content/estimate';
import { home } from '@/content/home';
import { splitEvents } from '@/domain/account';
import { eventTypeLabel } from '@/domain/catalog';
import { formatEventDate } from '@/domain/dates';
import type { EventRequest } from '@/domain/request';
import { accountServiceDeps, sessionUser } from '@/integrations/server';

// Magazines lie a little askew on the table, each at its own angle.
const tilts = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1'];
const cover = estimateContent.magazine.coverImage;

function Magazine({ request, when, index }: { request: EventRequest; when: string; index: number }) {
  const name = eventTypeLabel(request.event.type);
  return (
    <li className={`${tilts[index % tilts.length]} transition-transform hover:rotate-0 hover:-translate-y-1`}>
      <Link
        href={`/account/events/${request.id}`}
        aria-label={content.viewEvent(`${name}, ${formatEventDate(request.event.date)}`)}
        className="relative flex aspect-[3/4] w-[min(42vw,210px)] flex-col justify-between overflow-hidden bg-ink p-3 text-white no-underline shadow-[0_18px_30px_rgba(30,42,33,0.35)] sm:p-4"
      >
        <Image src={cover.src} alt="" fill sizes="210px" className="object-cover" />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/65" />
        <span className="relative flex items-start justify-between gap-2">
          <span className="font-hand text-[clamp(30px,7vw,44px)] leading-[0.8] text-sage">
            {home.brand}
          </span>
          <span className="bg-white px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-ink uppercase">
            {when}
          </span>
        </span>
        <span className="relative flex flex-col gap-1">
          <span className="font-serif text-[clamp(20px,4.5vw,28px)] leading-[1] italic">{name}</span>
          <span className="text-[10px] tracking-[0.16em] uppercase">
            {formatEventDate(request.event.date)}
          </span>
          <span className="text-[10px] tracking-[0.12em] text-white/80 uppercase">
            {content.statuses[request.status]}
          </span>
        </span>
      </Link>
    </li>
  );
}

export default async function AccountPage() {
  const user = await sessionUser();
  if (!user) {
    redirect('/login?next=/account');
  }

  const requests = await accountServiceDeps().requests.listByAccount(user.id);
  const { upcoming, past } = splitEvents(requests, format(new Date(), 'yyyy-MM-dd'));
  const magazines = [
    ...upcoming.map((request) => ({ request, when: content.upcomingTag })),
    ...past.map((request) => ({ request, when: content.pastTag })),
  ];

  return (
    <div
      className="min-h-svh bg-cover bg-center"
      style={{ backgroundImage: `url(${content.marble})` }}
    >
      <header className="mx-auto w-full max-w-[1280px] px-4 py-5 md:px-8">
        <Link href="/" className="font-hand text-[40px] leading-none no-underline">
          {home.brand}
        </Link>
      </header>
      <SiteMenu />
      <main className="mx-auto w-full max-w-[1100px] px-4 pt-6 pb-24 md:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="m-0 font-display text-[clamp(34px,3.6vw,52px)] leading-[1.08] font-normal">
              {content.title}
            </h1>
            <p className="mt-2 mb-0 max-w-[460px] text-[15px] text-ink">{content.tableIntro}</p>
          </div>
          <ButtonLink href="/plan" variant="accent">
            {content.createEvent}
          </ButtonLink>
        </div>

        {magazines.length === 0 ? (
          <p className="mt-16 mb-0 w-fit bg-white/80 px-4 py-3 font-serif italic">{content.emptyTable}</p>
        ) : (
          <ul
            aria-label={content.tableLabel}
            className="m-0 mt-14 flex list-none flex-wrap justify-center gap-x-8 gap-y-12 p-0 sm:justify-start"
          >
            {magazines.map(({ request, when }, index) => (
              <Magazine key={request.id} request={request} when={when} index={index} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
