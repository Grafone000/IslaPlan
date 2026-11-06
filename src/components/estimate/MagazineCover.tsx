import Image from 'next/image';
import { estimateContent } from '@/content/estimate';
import { home } from '@/content/home';
import { eventTypeLabel, partySizeLabel } from '@/domain/catalog';
import { formatEventDate } from '@/domain/dates';
import type { EventDetails } from '@/domain/request';

const content = estimateContent.magazine;

// The estimate opens on a magazine cover made for this event: masthead, big photo, cover lines.
export function MagazineCover({ event }: { event: EventDetails }) {
  const eventName = eventTypeLabel(event.type);
  return (
    <article
      aria-label={content.coverLabel}
      className="relative mx-auto aspect-[3/4] w-full max-w-[560px] overflow-hidden bg-ink text-white shadow-[0_24px_60px_rgba(30,42,33,0.28)]"
    >
      <Image
        src={content.coverImage.src}
        alt={content.coverImage.alt}
        fill
        preload
        sizes="(min-width: 640px) 560px, 100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60" />

      <div className="absolute inset-0 flex flex-col p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p className="m-0 font-hand text-[clamp(64px,16vw,104px)] leading-[0.8] text-sage">
            {home.brand}
          </p>
          <p className="m-0 mt-2 bg-white px-2 py-1 text-[11px] font-semibold tracking-[0.2em] text-ink uppercase">
            {content.issue}
          </p>
        </div>

        <p className="mt-6 mb-0 w-fit bg-sage px-2 py-1 text-[12px] font-semibold tracking-[0.18em] text-ink uppercase">
          {content.exclusive}
        </p>

        <div className="mt-auto flex flex-col gap-3">
          <p className="m-0 max-w-[80%] font-serif text-[clamp(40px,10vw,64px)] leading-[0.95] italic">
            {eventName}
          </p>
          <p className="m-0 text-[13px] tracking-[0.18em] uppercase">
            {formatEventDate(event.date)} · {partySizeLabel(event.partySize)}
          </p>
          <div className="flex flex-wrap gap-2">
            {content.coverLines.map((line) => (
              <span key={line} className="bg-white px-2 py-1 text-[12px] font-semibold text-ink uppercase">
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
