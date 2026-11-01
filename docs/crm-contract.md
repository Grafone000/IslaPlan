# CRM contract

The contract between the Event Planner and the future CRM. Types live in `src/domain/request.ts`, option ids in `src/domain/catalog.ts`.

Current version: `schemaVersion: 1`.

## Rules

- A breaking change increments `schemaVersion` and updates this file.
- Option ids are stable. Labels are not stored: the CRM resolves ids through the catalog.
- All amounts are integer pence. All timestamps are ISO 8601 UTC.
- `event.date`, `startTime` and `endTime` are local values with no time zone.
- A request reaches Supabase from `estimated` onwards. `draft` stays in the browser, because it has no contact details yet.
- `submitRequest` runs on every status change. `id` + `revision` make it idempotent, so the CRM updates rather than duplicates.
- The payload never holds card data or passwords.
- The server recalculates the estimate. Browser amounts are never trusted.

## Statuses

| Status | Meaning |
|---|---|
| `draft` | Wizard in progress |
| `estimated` | Estimate shown, awaiting an answer |
| `revising` | Estimate rejected, the client is changing the event |
| `declined` | Closed by the client. See `decisions.declinedAt` |
| `accepted` | Estimate accepted |
| `consultation-requested` | Client asked for a consultation |
| `deposit-pending` | Client wants to proceed, deposit not paid yet |
| `deposit-paid` | Deposit paid |

`declined` and `deposit-paid` are final.

## Transitions

| From | To |
|---|---|
| `draft` | `estimated` |
| `estimated` | `estimated` (re-estimate), `revising`, `accepted` |
| `revising` | `estimated`, `declined` |
| `accepted` | `estimated`, `consultation-requested`, `deposit-pending`, `declined` |
| `consultation-requested` | `estimated`, `deposit-pending`, `declined` |
| `deposit-pending` | `estimated`, `deposit-paid`, `declined` |

A move back to `estimated` means the client changed an answer: the estimate is recalculated and decisions are reset.

A fully on-request event has no deposit. When the client proceeds, the status does not change: `decisions.proceed` becomes `true`, and staff follow up.

## Closed values

| Field | Values |
|---|---|
| `estimate.kind` | `priced`, `partial`, `on-request` |
| `decisions.declinedAt` | `estimate`, `proceed`, `deposit`, `null` |
| `consultation.method` | `phone`, `email`, `null` |
| `payment.status` | `pending`, `paid`, `failed` |

With `on-request`, `totalLow`, `totalHigh`, `midpoint` and `depositAmount` are `null`.

`contact`, `estimate` and `payment` are `null` until that stage is reached. `decisions.estimateAccepted`, `consultationWanted` and `proceed` are `null` until answered.

## Option ids

| Field | Ids |
|---|---|
| `event.type` | `wedding`, `birthday`, `engagement`, `wedding-proposal`, `hen-stag-do`, `baby-shower`, `graduation`, `girls-boys-night`, `family-friends-reunion`, `other-bespoke` |
| `event.partySize` | `size-10-20`, `size-20-40`, `size-40-60`, `size-60-80`, `size-up-to-100` |
| `event.food` | `private-chef`, `lunch`, `dinner`, `afternoon-tea`, `canapes` |
| `event.drinks` | `cocktails-masterclass`, `wine-tasting`, `private-bartender`, `private-sommelier`, `drinks-all`, `wine-only`, `cocktails-spirits-only`, `byo-drinks` |
| `event.entertainment.items` | `dj`, `live-music`, `activities` |
| `event.decorations.items` | `flowers`, `balloons`, `personalised-items`, `other-bespoke` |
| `event.budget` | `under-1000`, `1000-2500`, `2500-5000`, `5000-10000`, `over-10000` |

## Example

```json
{
  "schemaVersion": 1,
  "id": "6f1c1f0e-2f43-4f52-9d0e-3f8a0a7f1b11",
  "revision": 5,
  "status": "deposit-pending",
  "statusHistory": [
    { "status": "draft", "at": "2026-11-01T16:50:00.000Z" },
    { "status": "estimated", "at": "2026-11-01T17:00:00.000Z" },
    { "status": "accepted", "at": "2026-11-01T17:02:00.000Z" },
    { "status": "consultation-requested", "at": "2026-11-01T17:03:00.000Z" },
    { "status": "deposit-pending", "at": "2026-11-01T17:05:00.000Z" }
  ],
  "createdAt": "2026-11-01T16:50:00.000Z",
  "updatedAt": "2026-11-01T17:05:00.000Z",
  "accountId": null,
  "contact": {
    "firstName": "Jamie",
    "lastName": "Doe",
    "email": "jamie@example.com",
    "phone": "07700900000"
  },
  "event": {
    "type": "wedding",
    "typeNote": null,
    "date": "2027-05-14",
    "startTime": "18:30",
    "endTime": "01:00",
    "endsNextDay": true,
    "partySize": "size-40-60",
    "food": ["dinner"],
    "drinks": ["wine-only"],
    "entertainment": { "items": ["dj"], "activitiesPreference": null },
    "decorations": { "items": ["flowers"], "note": null },
    "additionalInfo": "",
    "budget": "2500-5000"
  },
  "estimate": {
    "kind": "priced",
    "pricingVersion": "pricing-v1",
    "currency": "GBP",
    "guestsMin": 40,
    "guestsMax": 60,
    "lines": [
      { "category": "food", "item": "dinner", "lowPerPerson": 5000, "highPerPerson": 8500 },
      { "category": "drinks", "item": "wine-only", "lowPerPerson": 1400, "highPerPerson": 2500 },
      { "category": "entertainment", "item": "dj", "lowPerPerson": 1100, "highPerPerson": 2000 },
      { "category": "decorations", "item": "flowers", "lowPerPerson": 900, "highPerPerson": 2000 }
    ],
    "onRequestItems": [],
    "totalLow": 336000,
    "totalHigh": 900000,
    "midpoint": 618000,
    "depositPercent": 20,
    "depositAmount": 123600
  },
  "estimateHistory": [],
  "decisions": {
    "estimateAccepted": true,
    "consultationWanted": true,
    "proceed": true,
    "declinedAt": null
  },
  "consultation": { "method": "email", "messageId": "9b2d7c1a-5e34-4a6f-8c21-7d4e1f0a2b33" },
  "payment": {
    "provider": "stub",
    "paymentId": "stub_pay_123",
    "amount": 123600,
    "currency": "GBP",
    "status": "pending",
    "paidAt": null
  }
}
```
