import { estimateContent } from '@/content/estimate';
import {
  eventTypeLabel,
  itemLabel,
  partySizeLabel,
  type PricedCategory,
} from '@/domain/catalog';
import { choiceDetail } from '@/domain/choiceDetail';
import { formatEventDate } from '@/domain/dates';
import type { EventDetails } from '@/domain/request';

const content = estimateContent.magazine;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-4">
      <h3 className="m-0 mb-2 text-[12px] font-medium tracking-[0.22em] text-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Choices({
  category,
  items,
  event,
}: {
  category: PricedCategory;
  items: readonly string[];
  event: EventDetails;
}) {
  if (items.length === 0) {
    return <p className="m-0 font-serif italic text-muted">{content.none}</p>;
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {items.map((item) => {
        const detail = choiceDetail(category, item, event);
        return (
          <li key={item} className="font-serif text-[17px]">
            {itemLabel(category, item)}
            {detail && <span className="text-[15px] text-muted italic">: {detail}</span>}
          </li>
        );
      })}
    </ul>
  );
}

// The magazine's feature page: every choice of the event, before the numbers.
export function EventStory({ event }: { event: EventDetails }) {
  const notes = [
    event.typeNote,
    event.food.ownFoodNote,
    event.drinks.ownDrinksNote,
    event.entertainment.activitiesPreference,
    event.decorations.note,
    event.additionalInfo,
  ].filter((note): note is string => Boolean(note?.trim()));

  return (
    <article className="mx-auto w-full max-w-[640px] bg-white px-6 py-10 shadow-[0_24px_60px_rgba(30,42,33,0.12)] sm:px-10">
      <p className="m-0 text-[12px] tracking-[0.22em] text-muted uppercase">{content.featureKicker}</p>
      <h2 className="mt-2 mb-1 font-serif text-[clamp(34px,5vw,52px)] leading-[1.05] font-normal italic">
        {eventTypeLabel(event.type)}
      </h2>
      <p className="mt-0 mb-8 text-[14px] tracking-[0.12em] uppercase">
        {formatEventDate(event.date)} · {event.startTime} - {event.endTime}
        {event.endsNextDay ? ` ${content.nextDay}` : ''} · {partySizeLabel(event.partySize)}
      </p>

      <div className="flex flex-col gap-6">
        <Section title={content.sections.food}>
          <Choices category="food" items={event.food.items} event={event} />
        </Section>
        <Section title={content.sections.drinks}>
          <Choices category="drinks" items={event.drinks.items} event={event} />
        </Section>
        <Section title={content.sections.entertainment}>
          <Choices category="entertainment" items={event.entertainment.items} event={event} />
        </Section>
        <Section title={content.sections.decorations}>
          <Choices category="decorations" items={event.decorations.items} event={event} />
        </Section>
        {notes.length > 0 && (
          <Section title={content.sections.notes}>
            {notes.map((note) => (
              <p key={note} className="mt-0 mb-2 font-serif italic">
                “{note}”
              </p>
            ))}
          </Section>
        )}
      </div>
    </article>
  );
}
