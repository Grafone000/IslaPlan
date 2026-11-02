import type { TextareaHTMLAttributes } from 'react';

export function TextArea({
  label,
  ...input
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-[15px] font-medium">
      {label}
      <textarea
        rows={4}
        maxLength={2000}
        {...input}
        className="w-full rounded-button border border-line bg-white p-3.5 text-base font-normal text-ink focus:border-accent"
      />
    </label>
  );
}
