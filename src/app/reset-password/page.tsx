'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { PageShell } from '@/components/ui/PageShell';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { TextField } from '@/components/ui/TextField';
import { authContent as content } from '@/content/auth';
import { MIN_PASSWORD_LENGTH } from '@/domain/validation';
import { auth } from '@/integrations';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(content.validation.password);
      return;
    }
    setError(null);
    setBusy(true);
    const result = await auth.updatePassword(password);
    setBusy(false);
    if (result.ok) {
      router.replace('/');
      router.refresh();
    } else {
      setError(content.errors[result.error]);
    }
  }

  return (
    <PageShell title={content.titles.reset}>
      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
        <TextField
          label={content.fields.newPassword}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && (
          <p role="alert" className="m-0 text-[15px] text-accent">
            {error}
          </p>
        )}
        <SubmitButton disabled={busy}>
          {busy ? content.messages.working : content.actions.savePassword}
        </SubmitButton>
      </form>
    </PageShell>
  );
}
