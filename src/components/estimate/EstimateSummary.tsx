import { estimateContent as content } from '@/content/estimate';
import { itemLabel, type PricedCategory } from '@/domain/catalog';
import { choiceDetail } from '@/domain/choiceDetail';
import { formatMoney } from '@/domain/pricing/format';
import type { Estimate, EventDetails } from '@/domain/request';

export function EstimateAmount({ estimate }: { estimate: Estimate }) {
  if (estimate.totalLow === null || estimate.totalHigh === null) {
    return (
      <p className="m-0 font-serif text-[clamp(32px,4vw,44px)] leading-[1.1]">
        {content.onRequest}
      </p>
    );
  }
  return (
    <p className="m-0 font-serif text-[clamp(38px,5vw,56px)] leading-[1.05]">
      {formatMoney(estimate.totalLow)} - {formatMoney(estimate.totalHigh)}
    </p>
  );
}

function ChoiceItem({
  category,
  item,
  event,
}: {
  category: PricedCategory;
  item: string;
  event: EventDetails;
}) {
  const detail = choiceDetail(category, item, event);
  return (
    <li>
      {itemLabel(category, item)}
      {detail && <span className="text-muted">: {detail}</span>}
    </li>
  );
}

export function EstimateSummary({ estimate, event }: { estimate: Estimate; event: EventDetails }) {
  const hasOwnDrinks = estimate.lines.some((line) => line.item === 'byo-drinks');
  const hasOwnFood = event.food.items.includes('own-food');
  return (
    <section className="rounded-button bg-surface p-6">
      <EstimateAmount estimate={estimate} />
      <p className="mt-2 mb-0 text-muted">
        {estimate.kind === 'on-request' ? content.onRequestBody : content.guests(estimate.guests)}
      </p>
      <p className="mt-3 mb-0 text-[15px] text-muted">{content.indicative}</p>

      {estimate.lines.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-base font-semibold">{content.chosen}</h2>
          <ul className="m-0 list-disc pl-5">
            {estimate.lines.map((line) => (
              <ChoiceItem
                key={`${line.category}-${line.item}`}
                category={line.category}
                item={line.item}
                event={event}
              />
            ))}
          </ul>
        </>
      )}

      {estimate.onRequestItems.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-base font-semibold">
            {estimate.kind === 'on-request' ? content.chosen : content.onRequestItems}
          </h2>
          <ul className="m-0 list-disc pl-5">
            {estimate.onRequestItems.map((item) => (
              <ChoiceItem
                key={`${item.category}-${item.item}`}
                category={item.category}
                item={item.item}
                event={event}
              />
            ))}
          </ul>
        </>
      )}

      {hasOwnFood && <p className="mt-4 mb-0 text-[15px] text-muted">{content.ownFood}</p>}
      {hasOwnDrinks && <p className="mt-4 mb-0 text-[15px] text-muted">{content.corkage}</p>}
    </section>
  );
}
