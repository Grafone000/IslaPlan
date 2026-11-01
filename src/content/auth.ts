import type { AuthError } from '@/integrations';

export const authContent = {
  nav: { account: 'My area', accountHref: '/account', logOut: 'Log out' },
  tabs: { logIn: 'Log in', register: 'Create account' },
  fields: {
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    newPassword: 'New password',
  },
  actions: {
    logIn: 'Log in',
    register: 'Create account',
    forgot: 'Forgot your password?',
    sendReset: 'Send reset link',
    savePassword: 'Save new password',
    backToLogIn: 'Back to log in',
  },
  titles: {
    logIn: 'Welcome back',
    register: 'Create your account',
    forgot: 'Reset your password',
    reset: 'Choose a new password',
  },
  intro: 'Save your details so you only need to enter them once.',
  forgotIntro: "Enter your email and we'll send you a link to choose a new password.",
  messages: {
    checkEmail: 'Almost there. Please check your email to confirm your account.',
    resetSent: "If that email has an account, you'll receive a reset link shortly.",
    passwordSaved: 'Your new password is saved.',
    working: 'One moment...',
  },
  validation: {
    required: 'Please fill in every field.',
    email: 'Please enter a valid email address.',
    phone: 'Please enter a valid phone number.',
    password: 'Your password needs at least 8 characters.',
  },
  errors: {
    'invalid-credentials': 'That email and password do not match.',
    'email-taken': 'That email already has an account. Try logging in instead.',
    'weak-password': 'Please choose a stronger password.',
    unavailable: 'Accounts are not available right now. Please try again later.',
    unknown: 'Something went wrong. Please try again.',
  } satisfies Record<AuthError, string>,
} as const;
