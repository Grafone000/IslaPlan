import Link from 'next/link';
import type { ReactNode } from 'react';

type Variant = 'accent' | 'outline' | 'cta';

const variants: Record<Variant, string> = {
  accent: 'bg-accent px-[34px] font-bold text-on-accent',
  outline: 'border-[1.5px] border-white px-7 font-semibold text-white',
  cta: 'bg-cta px-[34px] font-bold text-cta-ink',
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
      className={`inline-flex min-h-[58px] items-center rounded-button text-base no-underline ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
