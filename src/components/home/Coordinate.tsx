import Image from 'next/image';
import { home } from '@/content/home';

const linkClass =
  'inline-flex min-h-11 items-center font-serif text-[clamp(20px,2vw,28px)] italic no-underline';

export function Coordinate() {
  const { coordinate } = home;
  return (
    <div className="relative h-full text-white">
      <Image
        src={coordinate.image.src}
        alt={coordinate.image.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(20,28,22,0.35)]" />
      <div className="relative flex h-full flex-col justify-between px-4 pt-20 pb-6 md:px-8 md:pb-8">
        <span />
        <h2 className="m-0 text-center text-[clamp(26px,4.5vw,64px)] leading-[1.15] font-light tracking-[0.14em] uppercase">
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
  );
}
