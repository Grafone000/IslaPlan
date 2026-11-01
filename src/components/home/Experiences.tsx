import Image from 'next/image';
import { home } from '@/content/home';
import { Reveal } from './Reveal';

export function Experiences() {
  return (
    <section id="experiences" className="flex flex-col font-body">
      {home.experiences.map((experience, index) => {
        const imageLast = index % 2 === 1;
        return (
          <article
            key={experience.title}
            className={`flex items-stretch ${imageLast ? 'flex-wrap-reverse' : 'flex-wrap'}`}
          >
            <div
              className={`relative h-[360px] min-w-0 grow-[1] basis-[560px] md:h-[600px] ${imageLast ? 'order-2' : ''}`}
            >
              <Image
                src={experience.image.src}
                alt={experience.image.alt}
                fill
                sizes="(min-width: 1024px) 57vw, 100vw"
                className="object-cover"
              />
            </div>
            <div
              className={`flex min-w-0 grow-[1] basis-[420px] flex-col justify-center gap-5 px-6 py-16 md:px-14 ${imageLast ? '' : 'bg-surface'}`}
            >
              <Reveal>
                <h2 className="m-0 font-display text-[clamp(38px,4vw,60px)] leading-[1.05] font-normal">
                  {experience.title}
                </h2>
              </Reveal>
              <Reveal delayMs={150}>
                <p className="m-0 text-muted">{experience.body}</p>
              </Reveal>
            </div>
          </article>
        );
      })}
    </section>
  );
}
