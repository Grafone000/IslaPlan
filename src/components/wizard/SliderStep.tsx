export function SliderStep({
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format(value: number): string;
  onChange(value: number): void;
}) {
  return (
    <label className="flex flex-col gap-3 rounded-button border border-line bg-white p-5 text-[15px] font-medium">
      {label}
      <span
        className="font-serif text-[clamp(32px,4vw,44px)] leading-[1.1] font-normal"
        aria-hidden="true"
      >
        {format(value)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(change) => onChange(Number(change.target.value))}
        className="h-11 w-full cursor-pointer accent-accent"
      />
      <span className="flex justify-between text-[14px] font-normal text-muted" aria-hidden="true">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </span>
    </label>
  );
}
