import { useState } from 'react';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { wizardContent as content } from '@/content/wizard';
import type { CatalogOption } from '@/domain/catalog';
import { toggleOption } from '@/domain/wizard';

export function MultiChoiceStep<Id extends string>({
  options,
  selected,
  onChange,
}: {
  options: readonly CatalogOption[];
  selected: readonly Id[];
  onChange(selected: Id[]): void;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  function toggle(option: CatalogOption) {
    const result = toggleOption(options, selected, option.id as Id);
    const removed = result.removed.map((item) => item.label).join(', ');
    setNotice(removed ? content.removed(removed, option.label) : null);
    onChange(result.selected);
  }

  return (
    <>
      <p className="mt-0 mb-4 text-muted">{content.hints.multiple}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <ChoiceCard
            key={option.id}
            label={option.label}
            selected={selected.includes(option.id as Id)}
            onClick={() => toggle(option)}
          />
        ))}
      </div>
      {notice && (
        <p role="status" className="mt-4 mb-0 text-[15px] text-accent">
          {notice}
        </p>
      )}
    </>
  );
}
