import Image from 'next/image';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { home } from '@/content/home';

export function BookCta() {
  const { book } = home;
  return (
    <section id="book" className="scroll-mt-16 bg-surface px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 md:grid-cols-2">
        <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden">
          <Image
            src={book.image.src}
            alt={book.image.alt}
            fill
            sizes="(min-width: 768px) 420px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col items-start gap-6 md:items-end md:text-right">
          <ButtonLink href={book.action.href} variant="accent">
            {book.action.label}
          </ButtonLink>
          <p className="m-0 max-w-[360px] text-[15px] text-muted">{book.body}</p>
        </div>
      </div>
    </section>
  );
}
