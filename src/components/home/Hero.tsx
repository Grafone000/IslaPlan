import Image from 'next/image';
import Link from 'next/link';
import { home } from '@/content/home';
import { ButtonLink } from '@/components/ui/ButtonLink';

const navLinkClass = 'inline-flex min-h-11 items-center no-underline';

export function Hero() {
  const { hero, nav, brand, bookAction } = home;
  return (
    <section id="top" className="relative flex min-h-[780px] flex-col overflow-hidden text-white">
      <Image src={hero.image.src} alt={hero.image.alt} fill preload sizes="100vw" className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(12,10,14,0.55)]" />

      <header className="relative mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-6 md:px-8">
        <a href="#top" className="font-serif text-[28px] no-underline">
          {brand}
        </a>
        <nav
          aria-label={nav.label}
          className="flex flex-wrap items-center gap-x-7 text-[15px] font-medium"
        >
          {nav.links.map((link) => (
            <a key={link.label} href={link.href} className={navLinkClass}>
              {link.label}
            </a>
          ))}
          <Link href={nav.logIn.href} className={navLinkClass}>
            {nav.logIn.label}
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-auto flex-col justify-end gap-7 px-6 pt-16 pb-24 md:px-8">
        <h1 className="m-0 max-w-[1100px] font-serif text-[clamp(52px,7vw,104px)] leading-none font-normal text-balance">
          {hero.title} <em className="block">{hero.titleEmphasis}</em>
        </h1>
        <p className="m-0 max-w-[560px] text-xl">{hero.intro}</p>
        <div className="flex flex-wrap gap-3.5">
          <ButtonLink href={bookAction.href} variant="accent">
            {bookAction.label}
          </ButtonLink>
          <ButtonLink href={hero.secondaryAction.href} variant="outline">
            {hero.secondaryAction.label}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
