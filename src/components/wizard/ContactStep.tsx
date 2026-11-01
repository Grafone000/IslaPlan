import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { authContent } from '@/content/auth';
import { wizardContent as content } from '@/content/wizard';
import type { Contact } from '@/domain/request';
import { isEmail, isPhone } from '@/domain/validation';

function validate(contact: Contact): string | null {
  if (Object.values(contact).some((value) => value.trim() === '')) {
    return content.contact.required;
  }
  if (!isEmail(contact.email)) return content.contact.email;
  if (!isPhone(contact.phone)) return content.contact.phone;
  return null;
}

export function ContactStep({
  contact,
  busy,
  onChange,
  onSubmit,
}: {
  contact: Contact;
  busy: boolean;
  onChange(contact: Contact): void;
  onSubmit(): void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { fields } = authContent;

  const field = (name: keyof Contact) => ({
    value: contact[name],
    onChange: (event: { target: { value: string } }) =>
      onChange({ ...contact, [name]: event.target.value }),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-muted">{content.hints.contact}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={fields.firstName} autoComplete="given-name" {...field('firstName')} />
        <TextField label={fields.lastName} autoComplete="family-name" {...field('lastName')} />
      </div>
      <TextField label={fields.email} type="email" autoComplete="email" {...field('email')} />
      <TextField label={fields.phone} type="tel" autoComplete="tel" {...field('phone')} />

      {error && (
        <p role="alert" className="m-0 text-[15px] text-accent">
          {error}
        </p>
      )}

      <p className="m-0 text-[15px]">
        {content.contact.haveAccount}{' '}
        <Link href="/login?next=/plan/contact" className="inline-flex min-h-11 items-center">
          {content.contact.logIn}
        </Link>
      </p>

      <div>
        <Button
          disabled={busy}
          onClick={() => {
            const invalid = validate(contact);
            setError(invalid);
            if (!invalid) onSubmit();
          }}
        >
          {busy ? content.saving : content.actions.seeEstimate}
        </Button>
      </div>
    </div>
  );
}
