import type { InputHTMLAttributes } from 'react';

export function TextField({
  label,
  ...input
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-[15px] font-medium">
      {label}
      <input
        {...input}
        className="min-h-12 w-full rounded-button border border-line bg-white px-3.5 text-base font-normal text-ink focus:border-accent"
      />
    </label>
  );
}
