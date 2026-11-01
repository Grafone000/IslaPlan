import { home } from '@/content/home';

export function Celebrate() {
  const { title, events } = home.celebrate;
  return (
    <section id="events" className="px-6 py-24 text-center font-body md:px-8">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-7">
        <h2 className="m-0 font-display text-[clamp(42px,5vw,72px)] leading-[1.05] font-normal">
          {title}
        </h2>
        <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 font-display text-[clamp(26px,2.8vw,38px)] leading-[1.3]">
          {events.map((event, index) => (
            <span key={event}>
              {event}
              {index < events.length - 1 && (
                <span aria-hidden="true" className="ml-7 text-eyebrow">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
