import Image from 'next/image';
import type { ReactNode } from 'react';
import type { BottleProduct } from '@/domain/catalog';
import { formatMoney } from '@/domain/pricing/format';

// One bottle of the wine list: picture, name, price, and its own choices once picked.
export function BottleCard({
  bottle,
  selected,
  onToggle,
  children,
}: {
  bottle: BottleProduct;
  selected: boolean;
  onToggle(): void;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col border bg-white ${selected ? 'border-accent' : 'border-line'}`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-4 border-0 bg-transparent p-4 text-left text-ink"
      >
        <span className="relative block h-28 w-16 shrink-0">
          <Image src={bottle.image} alt="" fill sizes="64px" className="object-contain" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="font-serif text-[20px] leading-tight">{bottle.name}</span>
          <span className="text-[14px] text-muted">{bottle.description}</span>
          <span className="text-[13px] tracking-[0.12em] uppercase">
            {formatMoney(bottle.priceMinor)}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center border text-[14px] ${
            selected ? 'border-accent bg-accent text-on-accent' : 'border-line'
          }`}
        >
          {selected ? '✓' : ''}
        </span>
      </button>
      {selected && children && <div className="border-t border-line p-4">{children}</div>}
    </div>
  );
}
