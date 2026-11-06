import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'accent' | 'outline' | 'cta';

const variants: Record<Variant, string> = {
  accent: 'bg-accent px-10 text-on-accent',
  outline: 'border border-white px-8 text-white',
  cta: 'bg-cta px-10 text-cta-ink',
};

export function ButtonLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: Variant;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[54px] items-center rounded-button text-[13px] font-medium tracking-[0.16em] uppercase no-underline ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
