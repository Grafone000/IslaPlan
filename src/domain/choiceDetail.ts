import {
  bottleKinds,
  bottleOf,
  glassSizeOf,
  isCocktailDrink,
  isMenuFood,
  isTimedDrink,
  isTimedEntertainment,
  menuOf,
  packageLabel,
  type PricedCategory,
} from './catalog';
import type { EventDetails, TimeSlot } from './request';

export const slotText = (slot: TimeSlot) => `${slot.startTime} - ${slot.endTime}`;

// The follow-up answer for a chosen item, such as its menu, bottles or hours, or '' if none.
export function choiceDetail(category: PricedCategory, item: string, event: EventDetails): string {
  if (category === 'food' && isMenuFood(item)) {
    return menuOf(item, event.food.menus[item])?.name ?? '';
  }
  if (category === 'drinks' && item === 'wine-only') {
    return event.drinks.wineBottles
      .map(({ product, glass, quantity }) => {
        const name = bottleOf(product)?.name ?? product;
        return `${quantity} × ${name} (${glassSizeOf(glass)?.label ?? ''})`;
      })
      .join(', ');
  }
  if (category === 'drinks' && isCocktailDrink(item)) {
    const label = packageLabel(item, event.drinks.packages[item]);
    const bottle = item === 'drinks-all' ? event.drinks.drinksAllBottle : null;
    if (!bottle) return label;
    const kind = bottleKinds.find((candidate) => candidate.id === bottle.kind)?.label ?? '';
    return [label, bottleOf(bottle.product)?.name ?? kind].filter(Boolean).join(', ');
  }
  if (category === 'drinks' && isTimedDrink(item)) {
    const slot = event.drinks.times[item];
    return slot ? slotText(slot) : '';
  }
  if (category === 'entertainment' && isTimedEntertainment(item)) {
    const slot = event.entertainment.times[item];
    return slot ? slotText(slot) : '';
  }
  return '';
}
