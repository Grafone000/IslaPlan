import { home } from '@/content/home';

export function EventList() {
  const { events } = home;
  return (
    <section id="events" className="scroll-mt-16 border-t border-line px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[880px]">
        <h2 className="m-0 mb-12 text-[13px] font-medium tracking-[0.2em] text-muted uppercase">
          {events.title}
        </h2>
        <ul className="m-0 grid list-none gap-x-16 gap-y-5 p-0 sm:grid-cols-2">
          {events.items.map((item) => (
            <li
              key={item}
              className="border-b border-line pb-4 font-serif text-[clamp(22px,2.4vw,32px)] leading-tight"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
