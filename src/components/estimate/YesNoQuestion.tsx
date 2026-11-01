import { Button } from '@/components/ui/Button';
import { estimateContent as content } from '@/content/estimate';

export function YesNoQuestion({
  question,
  disabled,
  onYes,
  onNo,
}: {
  question: string;
  disabled: boolean;
  onYes(): void;
  onNo(): void;
}) {
  return (
    <section className="mt-8">
      <h2 className="m-0 font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-normal">
        {question}
      </h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button disabled={disabled} onClick={onYes}>
          {content.answers.yes}
        </Button>
        <Button variant="outline" disabled={disabled} onClick={onNo}>
          {content.answers.no}
        </Button>
      </div>
    </section>
  );
}
