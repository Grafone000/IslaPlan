'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { PageShell } from '@/components/ui/PageShell';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { TextField } from '@/components/ui/TextField';
import { authContent as content } from '@/content/auth';
import { isEmail } from '@/domain/validation';
import { auth } from '@/integrations';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setError(content.validation.email);
      return;
    }
    setError(null);
    setBusy(true);
    const result = await auth.requestPasswordReset(email);
    setBusy(false);
    // Same answer whether or not the email has an account.
    if (!result.ok && result.error === 'unavailable') {
      setError(content.errors.unavailable);
    } else {
      setSent(true);
    }
  }

  return (
    <PageShell title={content.titles.forgot}>
      <p className="mt-3 mb-6 text-muted">{content.forgotIntro}</p>
      {sent ? (
        <p role="status">{content.messages.resetSent}</p>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField
            label={content.fields.email}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && (
            <p role="alert" className="m-0 text-[15px] text-accent">
              {error}
            </p>
          )}
          <SubmitButton disabled={busy}>
            {busy ? content.messages.working : content.actions.sendReset}
          </SubmitButton>
        </form>
      )}
      <p className="mt-5 text-center text-[15px]">
        <Link href="/login" className="inline-flex min-h-11 items-center">
          {content.actions.backToLogIn}
        </Link>
      </p>
    </PageShell>
  );
}
