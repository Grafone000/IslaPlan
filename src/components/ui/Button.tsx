import type { ReactNode } from 'react';

type Variant = 'accent' | 'outline';

const variants: Record<Variant, string> = {
  accent: 'bg-accent font-bold text-on-accent',
  outline: 'border-[1.5px] border-accent bg-transparent font-semibold text-accent',
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
      className={`inline-flex min-h-[58px] w-full cursor-pointer items-center justify-center rounded-button px-[34px] text-base disabled:cursor-default disabled:opacity-50 sm:w-auto ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
