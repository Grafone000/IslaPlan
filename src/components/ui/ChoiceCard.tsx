export function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-14 w-full cursor-pointer rounded-button border-[1.5px] px-4 py-3 text-left text-base font-medium ${
        selected
          ? 'border-accent bg-accent text-on-accent'
          : 'border-line bg-white text-ink hover:border-accent'
      }`}
    >
      {label}
    </button>
  );
}
