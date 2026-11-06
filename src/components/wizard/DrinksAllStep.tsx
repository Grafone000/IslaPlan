import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { wizardContent as content } from '@/content/wizard';
import { bottleKinds, bottleProducts, drinkPackages, type BottleKind } from '@/domain/catalog';
import type { DrinksAllBottle } from '@/domain/request';
import { BottleCard } from './BottleCard';
import { SingleChoiceStep } from './SingleChoiceStep';

// Drinks all: cocktails per guest, then wine or champagne, then the bottle itself.
export function DrinksAllStep({
  selectedPackage,
  bottle,
  onPackage,
  onBottle,
}: {
  selectedPackage: string | undefined;
  bottle: DrinksAllBottle | null;
  onPackage(id: string): void;
  onBottle(bottle: DrinksAllBottle): void;
}) {
  return (
    <div className="flex flex-col gap-10">
      <SingleChoiceStep
        options={drinkPackages['drinks-all']}
        selected={selectedPackage ?? null}
        onSelect={onPackage}
      />

      {selectedPackage && (
        <section>
          <h2 className="mt-0 mb-4 text-[13px] font-medium tracking-[0.18em] uppercase">
            {content.drinksAll.kind}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bottleKinds.map((kind) => (
              <ChoiceCard
                key={kind.id}
                label={kind.label}
                selected={bottle?.kind === kind.id}
                onClick={() => onBottle({ kind: kind.id as BottleKind, product: null })}
              />
            ))}
          </div>
        </section>
      )}

      {bottle && (
        <section>
          <h2 className="mt-0 mb-4 text-[13px] font-medium tracking-[0.18em] uppercase">
            {content.drinksAll.bottle}
          </h2>
          <div className="grid gap-3">
            {bottleProducts
              .filter((product) => product.kind === bottle.kind)
              .map((product) => (
                <BottleCard
                  key={product.id}
                  bottle={product}
                  selected={bottle.product === product.id}
                  onToggle={() => onBottle({ kind: bottle.kind, product: product.id })}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
