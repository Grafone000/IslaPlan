import type { ReactNode } from 'react';

export function SubmitButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center rounded-button bg-accent px-10 text-[13px] font-medium tracking-[0.16em] text-on-accent uppercase disabled:cursor-default disabled:opacity-60"
    >
      {children}
    </button>
  );
}
