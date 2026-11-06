import Image from 'next/image';
import { home } from '@/content/home';

const linkClass = 'inline-flex min-h-11 items-center font-serif text-[clamp(20px,2vw,28px)] italic no-underline';

export function Coordinate() {
  const { coordinate } = home;
  return (
    <section className="px-4 py-24 md:px-8 md:py-36">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-[880px] overflow-hidden md:aspect-[16/10]">
        <Image
          src={coordinate.image.src}
          alt={coordinate.image.alt}
          fill
          sizes="(min-width: 768px) 880px, 100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(20,28,22,0.35)]" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 text-white md:p-8">
          <span />
          <h2 className="m-0 text-center text-[clamp(26px,4.5vw,56px)] leading-[1.15] font-light tracking-[0.14em] uppercase">
            {coordinate.lines[0]}
            <br />
            {coordinate.lines[1]}
          </h2>
          <div className="flex items-end justify-between gap-4">
            <a href={coordinate.plan.href} className={linkClass}>
              • {coordinate.plan.label}
            </a>
            <a href={coordinate.see.href} className={`${linkClass} text-right`}>
              • {coordinate.see.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
