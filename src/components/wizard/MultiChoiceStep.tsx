import { useState, type ReactNode } from 'react';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { wizardContent as content } from '@/content/wizard';
import type { CatalogOption } from '@/domain/catalog';
import { toggleOption } from '@/domain/wizard';

export function MultiChoiceStep<Id extends string>({
  options,
  selected,
  onChange,
  renderDetail,
}: {
  options: readonly CatalogOption[];
  selected: readonly Id[];
  onChange(selected: Id[]): void;
  // Extra fields that open inside a chosen card, such as its times or a note.
  renderDetail?(id: Id): ReactNode;
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
        {options.map((option) => {
          const id = option.id as Id;
          const isSelected = selected.includes(id);
          const detail = isSelected ? renderDetail?.(id) : null;
          const card = (
            <ChoiceCard
              key={option.id}
              label={option.label}
              selected={isSelected}
              onClick={() => toggle(option)}
            />
          );
          if (!detail) {
            return card;
          }
          return (
            <div key={option.id} className="flex flex-col sm:col-span-2">
              {card}
              <div className="-mt-1 rounded-b-button border-[1.5px] border-t-0 border-accent bg-white p-4 pt-5">
                {detail}
              </div>
            </div>
          );
        })}
      </div>
      {notice && (
        <p role="status" className="mt-4 mb-0 text-[15px] text-accent">
          {notice}
        </p>
      )}
    </>
  );
}
