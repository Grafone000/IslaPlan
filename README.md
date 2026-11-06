# IslaPlan

Client app for planning an event at home: choose the event step by step, see an indicative estimate presented as a magazine, and talk to the organiser. Works on desktop and phone.

Every request, accepted or declined, is stored in a versioned shape for the future CRM: see [docs/crm-contract.md](docs/crm-contract.md).

**Not ready for real clients yet.** Payment and email are stubs and the prices are not validated. See [docs/known-issues.md](docs/known-issues.md).

## Stack

Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres, Auth, Storage), TipTap, react-day-picker. Tests: Vitest, Testing Library, Playwright.

## Setup

1. Install dependencies:

   ```bash
   npm install
   npx playwright install chromium
   ```

2. Copy `.env.example` to `.env.local` and fill in the values from the Supabase dashboard, Project Settings > API Keys. Use the project URL without any path, the publishable key and the secret key. `.env.local` is ignored by git.

3. In the Supabase SQL Editor, run [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql). It creates the tables, row level security and the two private storage buckets.

4. In Supabase, Authentication:
   - add `http://localhost:3000/**` to the Redirect URLs, for password reset links;
   - for development, turn off Confirm email. Turn it back on, with a real email provider, before going live.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app on http://localhost:3000 |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests, plus the row level security tests when Supabase is configured |
| `npm run test:e2e` | Playwright on desktop (1440 px) and phone (375 px) widths |
| `npm run build` | Production build |

End-to-end tests create their own users and requests in the Supabase project, then remove them, including uploaded files.

## Test cards

Clients are no longer asked for a deposit. The deposit page stays for older requests still waiting for one; it uses a stub provider. No card is charged, and only these numbers are accepted:

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment is declined |

Use any future expiry date, such as `12/30`, and any 3-digit CVC.

## Staff tasks until the CRM exists

- **Requests:** table `event_requests`. The full request is in `payload`.
- **Event photos:** in Storage, bucket `event-photos`, upload into a folder named after the request id. They appear in the client's private area.
- **Replies to clients:** add a row to `event_messages` with `direction` = `organiser`. `body` takes the editor's JSON format, for example `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}`, and `body_text` the same text as plain text.

## Where things live

| Path | Contents |
|---|---|
| `src/content/` | All editable copy |
| `src/config/business.ts` | Contact email, phone, deposit percentage |
| `src/domain/` | Pure logic: catalogue, request states, pricing, wizard |
| `src/integrations/` | Interfaces and their Supabase and stub implementations |
| `docs/pricing-rules.md` | How the estimate is calculated, and the open questions in the price sheet |
| `docs/known-issues.md` | Everything broken, unverified or pending |
