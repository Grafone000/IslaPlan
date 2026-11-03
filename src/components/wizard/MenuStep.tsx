import type { Menu } from '@/domain/catalog';

export function MenuStep({
  menus,
  selected,
  onSelect,
}: {
  menus: readonly Menu[];
  selected: string | undefined;
  onSelect(id: string): void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {menus.map((menu) => {
        const isSelected = selected === menu.id;
        return (
          <button
            key={menu.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(menu.id)}
            className={`flex w-full cursor-pointer flex-col gap-2 rounded-button border-[1.5px] p-4 text-left ${
              isSelected
                ? 'border-accent bg-accent text-on-accent'
                : 'border-line bg-white text-ink hover:border-accent'
            }`}
          >
            <span className="text-lg font-semibold">{menu.name}</span>
            <span className={`text-[15px] ${isSelected ? '' : 'text-muted'}`}>{menu.style}</span>
            <span className="flex flex-col gap-1 text-[15px]">
              {menu.dishes.map((dish) => (
                <span key={dish}>• {dish}</span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
