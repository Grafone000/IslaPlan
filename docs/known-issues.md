# Known issues and pending work

The running list of what does not work, what is unverified and what should be improved. Keep it up to date: add an item as soon as it is found, even if it is deferred, and remove it only when it is fixed and verified. Move the outcome to the commit message, not here.

Severity: **blocker** stops going live, **bug** is wrong behaviour, **unverified** has not been tested for real, **improve** is an optimisation.

## Open

### Blockers for going live

| Item | Detail |
|---|---|
| Prices not validated | The Excel sheet is a first working estimate, to be checked against real supplier quotes |
| Real payment | `PaymentProvider` is a stub: Stripe still to connect, with a server-side webhook |
| Real email | `EmailGateway` is a stub: messages are stored but nobody receives them |
| Staff tools | With no CRM, staff can only see requests, reply to messages and upload photos from the Supabase dashboard |
| Privacy | No privacy notice or UK GDPR basis for client data |
| Production setup | Needs a separate Supabase production project with backups, email confirmation on and `LINK_GUEST_REQUESTS=true` |
| API rate limits | Public APIs, usable by guests, have no rate limiting |
| Attachment size on hosting | Files of up to 10 MB go through the server. Vercel functions cap the body at about 4.5 MB, so large files would fail there: upload directly to Storage or lower the limit |
| Brand and contacts | `[Your Brand]`, `[City]`, `[email@yourbrand.com]` are placeholders |
| Provisional phone | `3519844008` is a test number, set in `src/config/business.ts` |

### Bugs

| Item | Detail |
|---|---|
| Intermittent Supabase connection timeouts | Some connections fail after 10 seconds with `UND_ERR_CONNECT_TIMEOUT`, then work again. Seen in a probe (2 of 6) and in several test runs, always on Node. Ruled out so far: keys, DNS (IPv4 only) and a bad address (both addresses answered 16 of 16 raw connections). Cause unknown: try another network or without VPN/antivirus filtering. A client would see "We couldn't save your request" and can retry |
| RLS test can fail on a full run | `npm run test` sometimes fails `tests/integration/rls.test.ts` with `fetch failed` after about 12 seconds, then passes on the next run. The retry added to the test did not stop it, which does not fit a plain timeout on one call, so the failing call may be elsewhere in its setup. If it fails, rerun before treating it as a real failure |

### Unverified

| Item | Detail |
|---|---|
| Create account form on real Supabase | Skipped while Confirm email is on, to avoid mailing fake addresses. Needs Confirm email off in Authentication |
| Password reset email | Never received for real. Needs a real inbox and `http://localhost:3000/**` in the Redirect URLs |
| Guest request linking | `LINK_GUEST_REQUESTS` is off in development, so the link has never run |
| Visual check of M6 and M7 pages | Estimate, revision, deposit, outcome and the email composer pass automated tests on both widths, but nobody has looked at them |

### Improvements

| Item | Detail |
|---|---|
| Home photos | The text says "at home", the photos show restaurants and hotels |
| Tooling audit warnings | `npm audit` reports moderate issues in the ESLint toolchain only. Not shipped to users. The only fix offered is a downgrade |
| ESLint 9 | Marked as no longer supported, kept because `eslint-config-next` needs it |
| Orphan files on failed send | If a message fails after its attachments upload, the files stay in Storage |
| Saved estimate discards the page on stale revision | A 409 shows a generic error. The client has to reload to continue |
| Wide estimate ranges | The high total combines high prices with maximum guests. See `docs/pricing-rules.md` |
