import Image from 'next/image';
import { home } from '@/content/home';
import { HeroName } from './HeroName';

export function Hero() {
  const { hero, brand } = home;
  return (
    <div className="relative flex h-full items-end text-white">
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(20,28,22,0.25)]" />
      <div className="relative flex w-full justify-end px-4 pb-4 md:px-8 md:pb-6">
        <HeroName name={brand} />
      </div>
    </div>
  );
}
