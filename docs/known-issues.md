# Known issues and pending work

The running list of what does not work, what is unverified and what should be improved. Keep it up to date: add an item as soon as it is found, even if it is deferred, and remove it only when it is fixed and verified. Move the outcome to the commit message, not here.

Severity: **blocker** stops going live, **bug** is wrong behaviour, **unverified** has not been tested for real, **improve** is an optimisation.

## Open

### Blockers for going live

| Item | Detail |
|---|---|
| Prices not validated | The Excel sheet is a first working estimate, to be checked against real supplier quotes. Brunch has no prices of its own: it copies Lunch |
| Placeholder wine list | Champagne and wine names, descriptions and prices are made up, and every bottle uses one of two placeholder photos (a real Tavernello carton among them). Replace with the real list in `src/domain/catalog.ts` before showing it to clients |
| Menus and cocktail counts have no price | The chosen menu, chef, number of cocktails or glass size are saved but do not change the estimate. A private chef costs the same whichever chef is chosen |
| Kendraw font not used | The IslaPlan name uses Nanum Pen Script, a free hand-drawn face close to Kendraw. Buy a Kendraw licence or keep the stand-in |
| Real payment | Clients are no longer asked for a deposit; the deposit page and API stay only for older `deposit-pending` requests. `PaymentProvider` and `PaymentGateway` are stubs: Stripe still to connect, with a server-side webhook. The stub gateway believes what the browser reports, so today anyone with a request id could mark its deposit as paid. Harmless with no real money, but it must not reach production |
| Real email | `EmailGateway` is a stub: messages are stored but nobody receives them |
| Staff tools | With no CRM, staff can only see requests, reply to messages and upload photos from the Supabase dashboard |
| Privacy | No privacy notice or UK GDPR basis for client data |
| Production setup | Needs a separate Supabase production project with backups, email confirmation on and `LINK_GUEST_REQUESTS=true` |
| API rate limits | Public APIs, usable by guests, have no rate limiting |
| Attachment size on hosting | Files of up to 10 MB go through the server. Vercel functions cap the body at about 4.5 MB, so large files would fail there: upload directly to Storage or lower the limit |
| Brand and contacts | The brand is now IslaPlan; `[City]` and `[email@yourbrand.com]` in the footer are still placeholders |
| Provisional phone | `3519844008` is a test number, set in `src/config/business.ts` |

### Bugs

| Item | Detail |
|---|---|
| Intermittent Supabase connection timeouts | Some connections fail after 10 seconds with `UND_ERR_CONNECT_TIMEOUT`, then work again. Seen in a probe (2 of 6) and in several test runs, always on Node. Ruled out so far: keys, DNS (IPv4 only) and a bad address (both addresses answered 16 of 16 raw connections). Cause unknown: try another network or without VPN/antivirus filtering. A client would see "We couldn't save your request" and can retry. The RLS test retries the connection for this reason |
| End-to-end tests fail now and then | Tests that log in or call Supabase sometimes fail on the connection timeout above, then pass when rerun alone. Seen with the private area tests in M10. Rerun a failing Supabase test before treating it as a real failure |
| App not reachable from other devices in development | `npm run dev` only serves this PC. Next prints the NordVPN address (`100.x`), which a phone cannot reach, and Next 16 blocks its dev scripts on any address not listed in `allowedDevOrigins`. To show the app to anyone else, deploy it (Vercel) instead |
| Organiser replies are awkward to add | Replies go in by hand in the Supabase dashboard, as editor JSON. Fine for testing, not for daily use: the CRM should own this |

### Unverified

| Item | Detail |
|---|---|
| Create account form on real Supabase | Skipped while Confirm email is on, to avoid mailing fake addresses. Needs Confirm email off in Authentication |
| Password reset email | Never received for real. Needs a real inbox and `http://localhost:3000/**` in the Redirect URLs |
| Guest request linking | `LINK_GUEST_REQUESTS` is off in development, so the link has never run |
| Accessibility beyond the basics | Automated checks cover titles, control names, image text, focus and colour contrast. No screen reader test has been done |

### Improvements

| Item | Detail |
|---|---|
| Home photos | The text says "at home", the photos show restaurants and hotels |
| Tooling audit warnings | `npm audit` reports moderate issues in the ESLint toolchain only. Not shipped to users. The only fix offered is a downgrade |
| ESLint 9 | Marked as no longer supported, kept because `eslint-config-next` needs it |
| Orphan files on failed send | If a message fails after its attachments upload, the files stay in Storage |
| Stale request after two tabs | If the same request changes in another tab, the next action gets a 409 and a generic error. The client has to reload to continue |
| Resuming an event from the private area | An open event shows in My area, but the client can only carry on with the estimate from the browser that started it |
| Photo size | Event photos load at full size, because signed links skip the image optimiser. Slow on a phone if staff upload large files |
| Message dates | Messages show the date only, in UTC, with no time |
| Old requests | Requests saved before schema 3 are converted when read: removed drinks are dropped, and menus, packages and bottles that did not exist are empty. If such a client edits the event, the wizard asks for the missing answers. Only test data exists today |
| Service times reset when the event hours change | Changing the event start or end resets a bartender, sommelier, DJ or live music slot that no longer fits, without telling the client |
| Magazine cover photo | Every estimate cover and every magazine in My area uses the same photo. One photo per event type would read better |
| Wine only quantities | Nothing checks that the bottles chosen are enough for the guests |
| Month-ahead rule uses the server's day | The earliest date is one month from today on the server clock (UTC). Near midnight the browser and the server can disagree by a day |
| Page turn in a background tab | The magazine page turn is a CSS animation. Screenshots from a hidden browser pane can catch it half-way |
