'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { PageShell } from '@/components/ui/PageShell';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { TextField } from '@/components/ui/TextField';
import { authContent as content } from '@/content/auth';
import { MIN_PASSWORD_LENGTH, isEmail, isPhone } from '@/domain/validation';
import { auth } from '@/integrations';

type Mode = 'logIn' | 'register';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', password: '' };

function validate(mode: Mode, form: typeof emptyForm): string | null {
  const required =
    mode === 'register' ? Object.values(form) : [form.email, form.password];
  if (required.some((value) => value.trim() === '')) return content.validation.required;
  if (!isEmail(form.email)) return content.validation.email;
  if (mode === 'register' && !isPhone(form.phone)) return content.validation.phone;
  if (mode === 'register' && form.password.length < MIN_PASSWORD_LENGTH) {
    return content.validation.password;
  }
  return null;
}

export function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('logIn');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const field = (name: keyof typeof emptyForm) => ({
    name,
    value: form[name],
    onChange: (event: { target: { value: string } }) =>
      setForm((current) => ({ ...current, [name]: event.target.value })),
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    const invalid = validate(mode, form);
    setError(invalid);
    if (invalid) return;

    setBusy(true);
    const result =
      mode === 'logIn' ? await auth.login(form.email, form.password) : await auth.register(form);
    setBusy(false);

    if (!result.ok) {
      setError(content.errors[result.error]);
    } else if (result.needsEmailConfirmation) {
      setNotice(content.messages.checkEmail);
    } else {
      void fetch('/api/account/link-guest-requests', { method: 'POST' }).catch(() => {});
      router.replace(next);
      router.refresh();
    }
  }

  const tabClass = (tab: Mode) =>
    `min-h-11 flex-1 cursor-pointer border-0 border-b-2 bg-transparent text-base font-semibold text-ink ${
      mode === tab ? 'border-accent' : 'border-line'
    }`;

  return (
    <PageShell title={content.titles[mode]}>
      <p className="mt-3 mb-6 text-muted">{content.intro}</p>

      <div role="tablist" className="mb-6 flex">
        {(['logIn', 'register'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            className={tabClass(tab)}
            onClick={() => {
              setMode(tab);
              setError(null);
              setNotice(null);
            }}
          >
            {content.tabs[tab]}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {mode === 'register' && (
          <>
            <TextField
              label={content.fields.firstName}
              autoComplete="given-name"
              {...field('firstName')}
            />
            <TextField
              label={content.fields.lastName}
              autoComplete="family-name"
              {...field('lastName')}
            />
          </>
        )}
        <TextField
          label={content.fields.email}
          type="email"
          autoComplete="email"
          {...field('email')}
        />
        {mode === 'register' && (
          <TextField
            label={content.fields.phone}
            type="tel"
            autoComplete="tel"
            {...field('phone')}
          />
        )}
        <TextField
          label={content.fields.password}
          type="password"
          autoComplete={mode === 'logIn' ? 'current-password' : 'new-password'}
          {...field('password')}
        />

        {error && (
          <p role="alert" className="m-0 text-[15px] text-accent">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="m-0 text-[15px]">
            {notice}
          </p>
        )}

        <SubmitButton disabled={busy}>
          {busy ? content.messages.working : content.actions[mode]}
        </SubmitButton>
      </form>

      {mode === 'logIn' && (
        <p className="mt-5 text-center text-[15px]">
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center">
            {content.actions.forgot}
          </Link>
        </p>
      )}
    </PageShell>
  );
}
