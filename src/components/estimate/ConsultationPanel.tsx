import { business } from '@/config/business';
import { estimateContent as content } from '@/content/estimate';

const actionClass =
  'inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center rounded-button border border-ink bg-transparent px-8 text-[13px] font-medium tracking-[0.16em] text-ink uppercase no-underline sm:w-auto';

export function ConsultationPanel({
  onCall,
  onEmail,
}: {
  onCall(): void;
  onEmail(): void;
}) {
  return (
    <section className="mt-8 rounded-button border border-line bg-white p-6">
      <p className="mt-0 mb-3">{content.consultation.intro}</p>
      <p className="m-0">{business.contactEmail}</p>
      <p className="m-0">{business.contactPhoneDisplay}</p>
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
