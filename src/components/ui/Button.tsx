import type { ReactNode } from 'react';

type Variant = 'accent' | 'outline';

const variants: Record<Variant, string> = {
  accent: 'border border-accent bg-accent text-on-accent',
  outline: 'border border-ink bg-transparent text-ink',
};

export function Button({
  variant = 'accent',
  disabled,
  onClick,
  children,
}: {
  variant?: Variant;
  disabled?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center rounded-button px-10 text-[13px] font-medium tracking-[0.16em] uppercase disabled:cursor-default disabled:opacity-50 sm:w-auto ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
