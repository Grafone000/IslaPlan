import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthForm } from './AuthForm';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock('@/integrations', () => ({
  auth: { login: mocks.login, register: mocks.register },
}));

const success = { ok: true, needsEmailConfirmation: false };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null)));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

async function fillLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Email'), 'jamie@example.com');
  await user.type(screen.getByLabelText('Password'), 'secret-password');
  await user.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1) as HTMLElement);
}

describe('AuthForm', () => {
  it('returns to the Home after logging in', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue(success);
    render(<AuthForm next="/" />);
    await fillLogin(user);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(mocks.login).toHaveBeenCalledWith('jamie@example.com', 'secret-password');
  });

  it('honours a return path from the wizard', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue(success);
    render(<AuthForm next="/plan/contact" />);
    await fillLogin(user);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/plan/contact'));
  });

  it('shows a friendly error for a wrong password', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ ok: false, error: 'invalid-credentials' });
    render(<AuthForm next="/" />);
    await fillLogin(user);
    expect((await screen.findByRole('alert')).textContent).toBe(
      'That email and password do not match.',
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('validates before calling the provider', async () => {
    const user = userEvent.setup();
    render(<AuthForm next="/" />);
    await user.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1) as HTMLElement);
    expect(screen.getByRole('alert').textContent).toBe('Please fill in every field.');
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('asks for full details when creating an account', async () => {
    const user = userEvent.setup();
    mocks.register.mockResolvedValue(success);
    render(<AuthForm next="/" />);
    await user.click(screen.getByRole('tab', { name: 'Create account' }));
    await user.type(screen.getByLabelText('First name'), 'Jamie');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'jamie@example.com');
    await user.type(screen.getByLabelText('Phone'), '07700900000');
    await user.type(screen.getByLabelText('Password'), 'short');
    const submit = screen.getAllByRole('button', { name: 'Create account' }).at(-1) as HTMLElement;
    await user.click(submit);
    expect(screen.getByRole('alert').textContent).toContain('at least 8 characters');
    expect(mocks.register).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Password'), '-but-longer');
    await user.click(submit);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/'));
    expect(mocks.register).toHaveBeenCalledWith({
      firstName: 'Jamie',
      lastName: 'Doe',
      email: 'jamie@example.com',
      phone: '07700900000',
      password: 'short-but-longer',
    });
  });

  it('asks to check the inbox when confirmation is required', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ ok: true, needsEmailConfirmation: true });
    render(<AuthForm next="/" />);
    await fillLogin(user);
    expect((await screen.findByRole('status')).textContent).toContain('check your email');
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
