import { ChoiceCard } from '@/components/ui/ChoiceCard';
import type { CatalogOption } from '@/domain/catalog';

export function SingleChoiceStep({
  options,
  selected,
  onSelect,
}: {
  options: readonly CatalogOption[];
  selected: string | null;
  onSelect(id: string): void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <ChoiceCard
          key={option.id}
          label={option.label}
          selected={selected === option.id}
          onClick={() => onSelect(option.id)}
        />
      ))}
    </div>
  );
}
