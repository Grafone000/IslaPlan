import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteMenu } from '@/components/home/SiteMenu';
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
      <header className="mx-auto w-full max-w-[1280px] px-4 py-5 md:px-8">
        <Link href="/" className="font-hand text-[40px] leading-none no-underline">
          {home.brand}
        </Link>
      </header>
      <SiteMenu />
      <main className={`mx-auto w-full px-6 pt-8 pb-24 ${wide ? 'max-w-[720px]' : 'max-w-[480px]'}`}>
        <h1 className="m-0 font-display text-[clamp(34px,3.6vw,52px)] leading-[1.08] font-normal">
          {title}
        </h1>
        {children}
      </main>
    </>
  );
}
