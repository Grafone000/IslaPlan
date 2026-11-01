import Link from 'next/link';
import type { ReactNode } from 'react';
import { home } from '@/content/home';

export function PageShell({
  title,
  wide = false,
  children,
}: {
  title: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <header className="mx-auto w-full max-w-[1280px] px-6 py-6 md:px-8">
        <Link href="/" className="font-serif text-[28px] no-underline">
          {home.brand}
        </Link>
      </header>
      <main className={`mx-auto w-full px-6 pt-8 pb-24 ${wide ? 'max-w-[720px]' : 'max-w-[480px]'}`}>
        <h1 className="m-0 font-display text-[clamp(38px,4vw,60px)] leading-[1.05] font-normal">
          {title}
        </h1>
        {children}
      </main>
    </>
  );
}
