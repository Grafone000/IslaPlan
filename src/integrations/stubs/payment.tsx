'use client';

import { useEffect, useRef, useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { paymentContent as content } from '@/content/payment';
import type { CardFormProps, PaymentProvider, PaymentResult } from '../contracts';

const SUCCESS_CARD = '4242424242424242';
const DECLINED_CARD = '4000000000000002';
const EXPIRY_PATTERN = /^(0[1-9]|1[0-2])\/(\d{2})$/;

interface CardFields {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
}

const digits = (value: string) => value.replace(/\D/g, '');

function validate(card: CardFields, now: Date): string | null {
  if (Object.values(card).some((value) => value.trim() === '')) return content.errors.required;

  const number = digits(card.number);
  if (number !== SUCCESS_CARD && number !== DECLINED_CARD) return content.errors.testOnly;

  const expiry = EXPIRY_PATTERN.exec(card.expiry.trim());
  if (!expiry) return content.errors.expiry;
  const lastValidMonth = new Date(2000 + Number(expiry[2]), Number(expiry[1]), 1);
  if (lastValidMonth <= now) return content.errors.expiry;

  if (!/^\d{3,4}$/.test(card.cvc.trim())) return content.errors.cvc;
  return null;
}

// Card values live only in this component's state: they are never stored, logged, sent to our
// server or passed to the page. Inputs have no name, so they cannot be submitted with a form.
function StubCardForm({ onReady }: CardFormProps) {
  const [card, setCard] = useState<CardFields>({ name: '', number: '', expiry: '', cvc: '' });
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef(card);

  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  useEffect(() => {
    onReady({
      async confirm(): Promise<PaymentResult> {
        const invalid = validate(cardRef.current, new Date());
        setError(invalid);
        if (invalid) {
          return { status: 'invalid' };
        }
        return { status: digits(cardRef.current.number) === SUCCESS_CARD ? 'paid' : 'failed' };
      },
    });
  }, [onReady]);

  const field = (key: keyof CardFields) => ({
    value: card[key],
    autoComplete: 'off',
    onChange: (event: { target: { value: string } }) =>
      setCard((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="flex flex-col gap-4">
      <div role="note" className="rounded-button border border-accent bg-white p-4 text-[15px]">
        <p className="m-0 font-semibold">{content.demo}</p>
        <p className="mt-1 mb-0 text-muted">{content.testCards}</p>
      </div>
      <TextField label={content.fields.name} {...field('name')} />
      <TextField label={content.fields.number} inputMode="numeric" {...field('number')} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label={content.fields.expiry} {...field('expiry')} />
        <TextField label={content.fields.cvc} inputMode="numeric" {...field('cvc')} />
      </div>
      {error && (
        <p role="alert" className="m-0 text-[15px] text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

export const stubPaymentProvider: PaymentProvider = {
  provider: 'stub',
  CardForm: StubCardForm,
  confirmDepositPayment(_paymentId, handle) {
    return handle.confirm();
  },
};
