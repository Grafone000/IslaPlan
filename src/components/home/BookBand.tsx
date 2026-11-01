import Image from 'next/image';
import { home } from '@/content/home';
import { ButtonLink } from '@/components/ui/ButtonLink';

export function BookBand() {
  const { book, bookAction } = home;
  return (
    <section id="book" className="flex flex-wrap items-stretch bg-band text-band-ink">
      <div className="flex min-w-0 grow-[1] basis-[480px] flex-col justify-center gap-6 px-6 py-24 md:px-14">
        <h2 className="m-0 font-serif text-[clamp(42px,5vw,72px)] leading-[1.02] font-normal">
          {book.title}
        </h2>
        <p className="m-0 max-w-[480px] text-[19px]">{book.body}</p>
        <div>
          <ButtonLink href={bookAction.href} variant="cta">
            {bookAction.label}
          </ButtonLink>
        </div>
      </div>
      <div className="relative h-[360px] min-w-0 grow-[1] basis-[420px] md:h-[560px]">
        <Image
          src={book.image.src}
          alt={book.image.alt}
          fill
          sizes="(min-width: 1024px) 47vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
