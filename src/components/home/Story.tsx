import Image from 'next/image';
import { home } from '@/content/home';
import { Reveal } from './Reveal';

export function Story() {
  const { story, brand } = home;
  return (
    <section className="px-4 pb-24 md:px-8 md:pb-36">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 md:grid-cols-[1fr_minmax(0,460px)] md:gap-20">
        <Reveal>
          <h2 className="m-0 max-w-[520px] font-serif text-[clamp(30px,3.4vw,46px)] leading-[1.1] font-normal">
            {story.title} <em className="block">{story.titleEmphasis}</em>
          </h2>
          <div className="mt-8 flex max-w-[520px] flex-col gap-4 text-[15px] text-muted">
            {story.paragraphs.map((paragraph) => (
              <p key={paragraph} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={story.image.src}
            alt={story.image.alt}
            fill
            sizes="(min-width: 768px) 460px, 100vw"
            className="object-cover"
          />
        </div>
      </div>
      <p
        aria-hidden="true"
        className="mx-auto mt-16 mb-0 max-w-[1180px] text-right font-hand text-[clamp(72px,12vw,180px)] leading-none text-accent"
      >
        {brand}
      </p>
    </section>
  );
}
