import { useState } from 'react';
import { wizardContent as content } from '@/content/wizard';
import {
  bottleKinds,
  bottleOf,
  bottleProducts,
  glassSizes,
  MAX_BOTTLES,
  type BottleKind,
  type GlassSizeId,
} from '@/domain/catalog';
import type { WineBottle } from '@/domain/request';
import { BottleCard } from './BottleCard';

const selectClass =
  'min-h-12 w-full rounded-button border border-line bg-white px-3 text-base font-normal text-ink';

// Wine only: champagne and wines side by side, any number of bottles, each poured its own way.
export function WineBottlesStep({
  bottles,
  onChange,
}: {
  bottles: readonly WineBottle[];
  onChange(bottles: WineBottle[]): void;
}) {
  // Open on the kind of the first bottle already chosen, so a return shows the choices.
  const [kind, setKind] = useState<BottleKind>(
    bottleOf(bottles[0]?.product)?.kind ?? 'sparkling',
  );
  const chosen = (product: string) => bottles.find((bottle) => bottle.product === product);
  const update = (product: string, patch: Partial<WineBottle>) =>
    onChange(bottles.map((bottle) => (bottle.product === product ? { ...bottle, ...patch } : bottle)));

  function toggle(product: string) {
    onChange(
      chosen(product)
        ? bottles.filter((bottle) => bottle.product !== product)
        : [...bottles, { product, glass: 'glass-150', quantity: 1 }],
    );
  }

  return (
    <>
      <div role="tablist" aria-label={content.wine.kinds} className="mb-6 flex gap-6 border-b border-line">
        {bottleKinds.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={kind === option.id}
            onClick={() => setKind(option.id)}
            className={`-mb-px min-h-11 cursor-pointer border-0 border-b bg-transparent px-0 text-[13px] tracking-[0.14em] uppercase ${
              kind === option.id ? 'border-ink text-ink' : 'border-transparent text-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {bottleProducts
          .filter((bottle) => bottle.kind === kind)
          .map((bottle) => {
            const pick = chosen(bottle.id);
            return (
              <BottleCard
                key={bottle.id}
                bottle={bottle}
                selected={pick !== undefined}
                onToggle={() => toggle(bottle.id)}
              >
                {pick && (
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <label className="flex flex-col gap-1.5 text-[14px]">
                      {content.wine.glass}
                      <select
                        aria-label={content.wine.glassFor(bottle.name)}
                        className={selectClass}
                        value={pick.glass}
                        onChange={(change) =>
                          update(bottle.id, { glass: change.target.value as GlassSizeId })
                        }
                      >
                        {glassSizes.map((size) => (
                          <option key={size.id} value={size.id}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-[14px]">
                      {content.wine.quantity}
                      <input
                        type="number"
                        min={1}
                        max={MAX_BOTTLES}
                        step={1}
                        aria-label={content.wine.quantityFor(bottle.name)}
                        className={selectClass}
                        value={pick.quantity}
                        onChange={(change) => {
                          const quantity = Math.round(Number(change.target.value));
                          update(bottle.id, {
                            quantity: Math.min(MAX_BOTTLES, Math.max(1, quantity || 1)),
                          });
                        }}
                      />
                    </label>
                  </div>
                )}
              </BottleCard>
            );
          })}
      </div>
      {bottles.length > 0 && (
        <p role="status" className="mt-4 mb-0 text-[15px] text-muted">
          {content.wine.chosen(bottles.length)}
        </p>
      )}
    </>
  );
}
