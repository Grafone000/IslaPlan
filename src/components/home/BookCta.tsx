import Image from 'next/image';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { home } from '@/content/home';
import { Footer } from './Footer';

// The last slide: the button on the right over a full photo, with the small footer below.
export function BookCta() {
  const { book } = home;
  return (
    <div className="relative flex h-full flex-col text-white">
      <Image
        src={book.image.src}
        alt={book.image.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(20,28,22,0.4)]" />
      <div className="relative flex flex-1 flex-col items-end justify-end gap-6 px-4 pb-10 text-right md:px-8 md:pb-16">
        <ButtonLink href={book.action.href} variant="accent">
          {book.action.label}
        </ButtonLink>
        <p className="m-0 max-w-[360px] text-[15px]">{book.body}</p>
      </div>
      <Footer />
    </div>
  );
}
