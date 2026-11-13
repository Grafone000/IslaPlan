import { home } from '@/content/home';

// A full sage slide with no photo, to break the run of pictures.
export function EventList() {
  const { events } = home;
  return (
    <div className="flex h-full items-center bg-band px-4 pt-20 pb-10 text-band-ink md:px-8">
      <div className="mx-auto w-full max-w-[960px]">
        <h2 className="m-0 mb-8 text-[12px] font-medium tracking-[0.2em] uppercase md:mb-12">
          {events.title}
        </h2>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-4 p-0 md:gap-x-16 md:gap-y-5">
          {events.items.map((item) => (
            <li
              key={item}
              className="border-b border-band-ink/20 pb-3 font-serif text-[clamp(18px,2.6vw,34px)] leading-tight md:pb-4"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
