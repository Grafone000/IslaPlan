import {
  isMenuFood,
  isPackagedDrink,
  isTimedDrink,
  isTimedEntertainment,
  menuOf,
  packageLabel,
  type PricedCategory,
} from './catalog';
import type { EventDetails, TimeSlot } from './request';

export const slotText = (slot: TimeSlot) => `${slot.startTime} - ${slot.endTime}`;

// The follow-up answer for a chosen item, such as its menu or its hours, or '' if none.
export function choiceDetail(category: PricedCategory, item: string, event: EventDetails): string {
  if (category === 'food' && isMenuFood(item)) {
    return menuOf(item, event.food.menus[item])?.name ?? '';
  }
  if (category === 'drinks' && isPackagedDrink(item)) {
    return packageLabel(item, event.drinks.packages[item]);
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
