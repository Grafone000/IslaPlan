import type { ReactNode } from 'react';

export function SubmitButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-[58px] w-full cursor-pointer items-center justify-center rounded-button bg-accent px-[34px] text-base font-bold text-on-accent disabled:cursor-default disabled:opacity-60"
    >
      {children}
    </button>
  );
}
