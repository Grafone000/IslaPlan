# CRM contract

The contract between the Event Planner and the future CRM. Types live in `src/domain/request.ts`, option ids in `src/domain/catalog.ts`.

Current version: `schemaVersion: 2`.

### Changes in version 2

- `event.partySize` (a band id) became `event.guests`, a whole number from 10 to 100.
- `event.budget` (a band id) became a number of pence from 50,000 to 2,000,000, in steps of 5,000. The top value means "£20,000 or more".
- `event.food` and `event.drinks` became objects with the chosen menus, drinks packages, service times and notes.
- `event.entertainment` gained `times` for the DJ and live music.
- `estimate.guestsMin` and `estimate.guestsMax` became `estimate.guests`.
- New options: Brunch and "I bring my own food".

Rows saved as version 1 stay in the database as they are. The app reads them as version 2: guests and budget become the top of the old band, and menus and packages are empty. The CRM can do the same, or read `schema_version` and handle both.

## Rules

- A breaking change increments `schemaVersion` and updates this file.
- Option ids are stable. Labels are not stored: the CRM resolves ids through the catalog.
- All amounts are integer pence. All timestamps are ISO 8601 UTC.
- `event.date`, `startTime` and `endTime` are local values with no time zone.
- A time slot is `{ startTime, startsNextDay, endTime, endsNextDay }`. It always sits inside the event hours, on the same 30-minute grid. The flags mark times after midnight.
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
| `event.food.items` | `brunch`, `lunch`, `dinner`, `canapes`, `afternoon-tea`, `private-chef`, `own-food` |
| `event.drinks.items` | `cocktails-masterclass`, `wine-tasting`, `private-bartender`, `private-sommelier`, `drinks-all`, `wine-only`, `cocktails-spirits-only`, `byo-drinks` |
| `event.entertainment.items` | `dj`, `live-music`, `activities` |
| `event.decorations.items` | `flowers`, `balloons`, `personalised-items`, `other-bespoke` |

## Follow-up answers

Each chosen item that needs one has exactly one entry, keyed by the item id. Entries for items not chosen are never stored.

| Field | Key | Value |
|---|---|---|
| `event.food.menus` | `brunch`, `lunch`, `canapes`, `afternoon-tea`, `private-chef` | A menu id, below |
| `event.food.ownFoodNote` | | Free text when `own-food` is chosen, else `null`. May be empty |
| `event.drinks.packages` | `cocktails-spirits-only`, `drinks-all`, `wine-only` | A package id, below |
| `event.drinks.times` | `private-bartender`, `private-sommelier` | A time slot |
| `event.drinks.ownDrinksNote` | | Free text when `byo-drinks` is chosen, else `null`. May be empty |
| `event.entertainment.times` | `dj`, `live-music` | A time slot |
| `event.entertainment.activitiesPreference` | | Free text when `activities` is chosen, else `null` |

Menu ids:

| Food | Ids |
|---|---|
| `brunch` | `sunday-table`, `maple-and-rye`, `golden-hour-kitchen` |
| `lunch` | `osteria-bellavista`, `copper-fork`, `saffron-and-smoke` |
| `canapes` | `petit-bouchee`, `little-plates-co`, `garden-party` |
| `afternoon-tea` | `rosewater-room`, `lady-marmalades`, `gilded-teapot` |
| `private-chef` | `alessandro-rinaldi`, `camille-dubois`, `naomi-hartley`, `kenji-mori`, `layla-haddad` |

Drinks package ids:

| Drink | Ids |
|---|---|
| `cocktails-spirits-only` | `four-cocktails-or-bottle`, `three-cocktails-or-half-bottle`, `two-cocktails-or-half-bottle`, `one-cocktail-or-half-bottle` |
| `drinks-all` | `four-cocktails`, `three-cocktails`, `two-cocktails`, `one-cocktail` |
| `wine-only` | `prosecco-champagne-6-glasses`, `wine-150ml`, `wine-175ml`, `wine-250ml` |

Dishes, chef names and package wording are in `src/domain/catalog.ts`.

## Example

```json
{
  "schemaVersion": 2,
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
    "guests": 50,
    "food": { "items": ["dinner"], "menus": {}, "ownFoodNote": null },
    "drinks": {
      "items": ["wine-only", "private-bartender"],
      "packages": { "wine-only": "wine-175ml" },
      "times": {
        "private-bartender": {
          "startTime": "19:00",
          "startsNextDay": false,
          "endTime": "00:30",
          "endsNextDay": true
        }
      },
      "ownDrinksNote": null
    },
    "entertainment": {
      "items": ["dj"],
      "times": {
        "dj": { "startTime": "18:30", "startsNextDay": false, "endTime": "01:00", "endsNextDay": true }
      },
      "activitiesPreference": null
    },
    "decorations": { "items": ["flowers"], "note": null },
    "additionalInfo": "",
    "budget": 500000
  },
  "estimate": {
    "kind": "priced",
    "pricingVersion": "pricing-v2",
    "currency": "GBP",
    "guests": 50,
    "lines": [
      { "category": "food", "item": "dinner", "lowPerPerson": 5000, "highPerPerson": 8500 },
      { "category": "drinks", "item": "wine-only", "lowPerPerson": 1400, "highPerPerson": 2500 },
      { "category": "drinks", "item": "private-bartender", "lowPerPerson": 1600, "highPerPerson": 2500 },
      { "category": "entertainment", "item": "dj", "lowPerPerson": 1100, "highPerPerson": 2000 },
      { "category": "decorations", "item": "flowers", "lowPerPerson": 1500, "highPerPerson": 1500 }
    ],
    "onRequestItems": [],
    "totalLow": 530000,
    "totalHigh": 850000,
    "midpoint": 690000,
    "depositPercent": 20,
    "depositAmount": 138000
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
    "amount": 138000,
    "currency": "GBP",
    "status": "pending",
    "paidAt": null
  }
}
```
