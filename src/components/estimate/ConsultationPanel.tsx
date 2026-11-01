import { business } from '@/config/business';
import { estimateContent as content } from '@/content/estimate';
import { formatMoney } from '@/domain/pricing/format';

const actionClass =
  'inline-flex min-h-[58px] w-full cursor-pointer items-center justify-center rounded-button border-[1.5px] border-accent bg-transparent px-7 text-base font-semibold text-accent no-underline sm:w-auto';

export function ConsultationPanel({
  onCall,
  onEmail,
}: {
  onCall(): void;
  onEmail(): void;
}) {
  const rate = formatMoney(business.consultationRatePerMinuteMinor);
  return (
    <section className="mt-8 rounded-button border border-line bg-white p-6">
      <p className="mt-0 mb-3">{content.consultation.intro}</p>
      <p className="m-0">{business.contactEmail}</p>
      <p className="m-0">{business.contactPhoneDisplay}</p>
      <p className="mt-1 mb-4 text-[15px] text-muted">{content.consultation.rate(rate)}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a href={`tel:${business.contactPhoneTel}`} onClick={onCall} className={actionClass}>
          {content.consultation.call}
        </a>
        <button type="button" onClick={onEmail} className={actionClass}>
          {content.consultation.email}
        </button>
      </div>
    </section>
  );
}
