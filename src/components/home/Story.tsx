import Image from 'next/image';
import { home } from '@/content/home';
import { Reveal } from './Reveal';

// The photo fills the slide; the story sits over it on the left, with the hand-written
// name below on the right.
export function Story() {
  const { story, brand } = home;
  return (
    <div className="relative h-full text-white">
      <Image
        src={story.image.src}
        alt={story.image.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[rgba(20,28,22,0.55)] md:bg-transparent md:bg-[linear-gradient(90deg,rgba(20,28,22,0.72)_0%,rgba(20,28,22,0.5)_45%,rgba(20,28,22,0.1)_100%)]"
      />
      <div className="relative flex h-full flex-col overflow-y-auto px-4 pt-20 pb-4 md:px-12 md:pb-6">
        <div className="my-auto max-w-[540px]">
          <Reveal>
            <h2 className="m-0 font-serif text-[clamp(26px,3.4vw,46px)] leading-[1.1] font-normal">
              {story.title} <em className="block">{story.titleEmphasis}</em>
            </h2>
            <div className="mt-5 flex flex-col gap-3 text-[13px] leading-[1.55] text-white/90 md:mt-8 md:gap-4 md:text-[15px]">
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph} className="m-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
        <p
          aria-hidden="true"
          className="m-0 shrink-0 self-end font-hand text-[clamp(64px,10vw,160px)] leading-none"
        >
          {brand}
        </p>
      </div>
    </div>
  );
}
