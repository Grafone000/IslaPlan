import type { ReactNode } from 'react';

export function Button({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-[58px] w-full cursor-pointer items-center justify-center rounded-button bg-accent px-[34px] text-base font-bold text-on-accent disabled:cursor-default disabled:opacity-50 sm:w-auto"
    >
      {children}
    </button>
  );
}
