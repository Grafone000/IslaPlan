import { estimateContent as content } from '@/content/estimate';
import { itemLabel } from '@/domain/catalog';
import { formatMoney } from '@/domain/pricing/format';
import type { Estimate } from '@/domain/request';

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

export function EstimateSummary({
  estimate,
  partySize,
}: {
  estimate: Estimate;
  partySize: string;
}) {
  const hasOwnDrinks = estimate.lines.some((line) => line.item === 'byo-drinks');
  return (
    <section className="rounded-button bg-surface p-6">
      <EstimateAmount estimate={estimate} />
      <p className="mt-2 mb-0 text-muted">
        {estimate.kind === 'on-request' ? content.onRequestBody : content.guests(partySize)}
      </p>
      <p className="mt-3 mb-0 text-[15px] text-muted">{content.indicative}</p>

      {estimate.lines.length > 0 && (
        <>
          <h2 className="mt-5 mb-2 text-base font-semibold">{content.chosen}</h2>
          <ul className="m-0 list-disc pl-5">
            {estimate.lines.map((line) => (
              <li key={`${line.category}-${line.item}`}>{itemLabel(line.category, line.item)}</li>
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
              <li key={`${item.category}-${item.item}`}>{itemLabel(item.category, item.item)}</li>
            ))}
          </ul>
        </>
      )}

      {hasOwnDrinks && <p className="mt-4 mb-0 text-[15px] text-muted">{content.corkage}</p>}
    </section>
  );
}
