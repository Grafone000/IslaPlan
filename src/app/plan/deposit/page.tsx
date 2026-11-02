'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRequestCommand } from '@/components/estimate/useRequestCommand';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/ui/PageShell';
import { useWizard } from '@/components/wizard/WizardProvider';
import { estimateContent as content } from '@/content/estimate';
import { paymentContent } from '@/content/payment';
import { formatMoney } from '@/domain/pricing/format';
import { estimateStage } from '@/domain/request';
import { payments, requestsApi, type CardFormHandle } from '@/integrations';

const { CardForm } = payments;

export default function DepositPage() {
  const router = useRouter();
  const wizard = useWizard();
  const { run, busy, error } = useRequestCommand();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const handle = useRef<CardFormHandle | null>(null);
  const started = useRef(false);

  const request = wizard?.state.request ?? null;
  const stage = request ? estimateStage(request) : null;
  const leave = wizard !== null && stage !== 'deposit';
  const dispatch = wizard?.dispatch;
  const id = wizard?.state.id;

  useEffect(() => {
    if (leave) {
      router.replace('/plan/estimate');
    }
  }, [leave, router]);

  useEffect(() => {
    if (!id || !dispatch || stage !== 'deposit' || started.current) {
      return;
    }
    started.current = true;
    requestsApi
      .startDeposit(id)
      .then((updated) => dispatch({ type: 'SET_REQUEST', request: updated }))
      .catch(() => setPayError(paymentContent.errors.failed));
  }, [dispatch, id, stage]);

  const onReady = useCallback((ready: CardFormHandle) => {
    handle.current = ready;
  }, []);

  async function pay() {
    const paymentId = request?.payment?.paymentId;
    if (!handle.current || !paymentId || !wizard) {
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const result = await payments.confirmDepositPayment(paymentId, handle.current);
      if (result.status !== 'invalid') {
        const updated = await requestsApi.confirmDeposit(wizard.state.id, paymentId, result.status);
        wizard.dispatch({ type: 'SET_REQUEST', request: updated });
        if (result.status === 'failed') {
          setPayError(paymentContent.errors.declined);
        }
      }
    } catch {
      setPayError(paymentContent.errors.failed);
    } finally {
      setPaying(false);
    }
  }

  const amount = request?.estimate?.depositAmount;
  if (!request?.estimate || leave || amount === null || amount === undefined) {
    return null;
  }

  const shownError = payError ?? error;
  return (
    <PageShell title={content.deposit.title}>
      <p className="mt-3 mb-2 text-muted">{content.deposit.intro(request.estimate.depositPercent)}</p>
      <p className="mt-0 mb-6 font-serif text-[clamp(38px,5vw,56px)] leading-[1.05]">
        {formatMoney(amount)}
      </p>

      <CardForm onReady={onReady} />

      {shownError && (
        <p role="alert" className="mt-4 mb-0 text-[15px] text-accent">
          {shownError}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button disabled={paying || busy || !request.payment} onClick={() => void pay()}>
          {paying ? paymentContent.paying : paymentContent.pay(formatMoney(amount))}
        </Button>
        <Button
          variant="outline"
          disabled={paying || busy}
          onClick={() => void run({ type: 'decline' })}
        >
          {content.deposit.notNow}
        </Button>
      </div>
    </PageShell>
  );
}
