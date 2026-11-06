# CRM contract

The contract between IslaPlan and the future CRM. Types live in `src/domain/request.ts`, option ids in `src/domain/catalog.ts`.

Current version: `schemaVersion: 3`.

### Changes in version 3

- `event.guests` went back to `event.partySize`, a band id. The fourth band is `size-60-80`.
- `event.drinks.items` lost `cocktails-masterclass` and `wine-tasting`.
- `event.drinks.packages` now holds only `cocktails-spirits-only` and `drinks-all`, with new ids.
- New `event.drinks.wineBottles` for Wine only and `event.drinks.drinksAllBottle` for Drinks all.
- `estimate.guests` went back to `estimate.guestsMin` and `estimate.guestsMax`, and `estimate.bottleLines` lists bottles priced by the bottle.
- Clients are no longer asked for a deposit: proceeding sets `decisions.proceed` to `true` and keeps the status. `deposit-pending` and `deposit-paid` only appear on older requests.

Rows saved as versions 1 and 2 stay in the database as they are. The app reads them as version 3: guests fall into their band, removed drinks are dropped, package ids are carried over where they still mean the same, and bottles are left empty. The CRM can do the same, or read `schema_version` and handle each.

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

When the client proceeds, the status does not change: `decisions.proceed` becomes `true`, and staff follow up. No deposit is asked. The `deposit-pending` transitions stay for requests saved before this change.

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
| `event.partySize` | `size-10-20`, `size-20-40`, `size-40-60`, `size-60-80`, `size-up-to-100` |
| `event.drinks.items` | `private-bartender`, `private-sommelier`, `drinks-all`, `wine-only`, `cocktails-spirits-only`, `byo-drinks` |
| `event.entertainment.items` | `dj`, `live-music`, `activities` |
| `event.decorations.items` | `flowers`, `balloons`, `personalised-items`, `other-bespoke` |

## Follow-up answers

Each chosen item that needs one has exactly one entry, keyed by the item id. Entries for items not chosen are never stored.

| Field | Key | Value |
|---|---|---|
| `event.food.menus` | `brunch`, `lunch`, `canapes`, `afternoon-tea`, `private-chef` | A menu id, below |
| `event.food.ownFoodNote` | | Free text when `own-food` is chosen, else `null`. May be empty |
| `event.drinks.packages` | `cocktails-spirits-only`, `drinks-all` | A cocktails package id, below |
| `event.drinks.drinksAllBottle` | | `{ kind, product }` when `drinks-all` is chosen, else `null`. `kind` is `sparkling` or `wine`; `product` is a bottle id of that kind |
| `event.drinks.wineBottles` | | List of `{ product, glass, quantity }` when `wine-only` is chosen, else empty. Each product at most once; `quantity` is 1 to 500 whole bottles |
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

Cocktails package ids:

| Drink | Ids |
|---|---|
| `cocktails-spirits-only` | `four-cocktails`, `three-cocktails`, `two-cocktails`, `one-cocktail` |
| `drinks-all` | `four-cocktails-bottle` (1 bottle per guest), `three-cocktails-half-bottle`, `two-cocktails-half-bottle`, `one-cocktail-half-bottle` (½ bottle per guest) |

Bottle ids (a placeholder list until the real wine list arrives):

| Kind | Ids |
|---|---|
| `sparkling` | `prosecco-extra-dry`, `rose-spumante`, `cremant-brut`, `franciacorta-saten`, `champagne-brut-reserve` |
| `wine` | `house-red`, `pinot-grigio`, `montepulciano`, `sauvignon-blanc`, `chianti-classico`, `rioja-reserva` |

Glass ids: `glass-150` (5 glasses of 150 ml a bottle), `glass-175` (4 of 175 ml), `glass-250` (3 of 250 ml).

Dishes, chef names, package wording, bottle names and prices are in `src/domain/catalog.ts`.

## Bottle lines

`estimate.bottleLines` has one entry per bottle priced by the bottle: `{ item, product, pricePerBottle, quantityLow, quantityHigh, amountLow, amountHigh }`. For Wine only the quantities are the client's. For Drinks all they are 1 or ½ bottle per guest, rounded up, for the minimum and the maximum guests. The amounts are added to `totalLow` and `totalHigh`.

## Example

```json
{
  "schemaVersion": 3,
  "id": "6f1c1f0e-2f43-4f52-9d0e-3f8a0a7f1b11",
  "revision": 4,
  "status": "consultation-requested",
  "statusHistory": [
    { "status": "draft", "at": "2026-11-06T16:50:00.000Z" },
    { "status": "estimated", "at": "2026-11-06T17:00:00.000Z" },
    { "status": "accepted", "at": "2026-11-06T17:02:00.000Z" },
    { "status": "consultation-requested", "at": "2026-11-06T17:03:00.000Z" }
  ],
  "createdAt": "2026-11-06T16:50:00.000Z",
  "updatedAt": "2026-11-06T17:05:00.000Z",
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
    "food": { "items": ["dinner"], "menus": {}, "ownFoodNote": null },
    "drinks": {
      "items": ["wine-only"],
      "packages": {},
      "drinksAllBottle": null,
      "wineBottles": [{ "product": "house-red", "glass": "glass-150", "quantity": 10 }],
      "times": {},
      "ownDrinksNote": null
    },
    "entertainment": {
      "items": ["dj", "live-music"],
      "times": {
        "dj": { "startTime": "18:30", "startsNextDay": false, "endTime": "21:30", "endsNextDay": false },
        "live-music": { "startTime": "21:30", "startsNextDay": false, "endTime": "01:00", "endsNextDay": true }
      },
      "activitiesPreference": null
    },
    "decorations": { "items": ["flowers"], "note": null },
    "additionalInfo": "",
    "budget": 500000
  },
  "estimate": {
    "kind": "priced",
    "pricingVersion": "pricing-v3",
    "currency": "GBP",
    "guestsMin": 40,
    "guestsMax": 60,
    "lines": [
      { "category": "food", "item": "dinner", "lowPerPerson": 5000, "highPerPerson": 8500 },
      { "category": "entertainment", "item": "dj", "lowPerPerson": 1100, "highPerPerson": 2000 },
      { "category": "entertainment", "item": "live-music", "lowPerPerson": 1700, "highPerPerson": 3500 },
      { "category": "decorations", "item": "flowers", "lowPerPerson": 1500, "highPerPerson": 1500 }
    ],
    "bottleLines": [
      {
        "item": "wine-only",
        "product": "house-red",
        "pricePerBottle": 1600,
        "quantityLow": 10,
        "quantityHigh": 10,
        "amountLow": 16000,
        "amountHigh": 16000
      }
    ],
    "onRequestItems": [],
    "totalLow": 388000,
    "totalHigh": 946000,
    "midpoint": 667000,
    "depositPercent": 20,
    "depositAmount": 133400
  },
  "estimateHistory": [],
  "decisions": {
    "estimateAccepted": true,
    "consultationWanted": true,
    "proceed": true,
    "declinedAt": null
  },
  "consultation": { "method": "email", "messageId": "9b2d7c1a-5e34-4a6f-8c21-7d4e1f0a2b33" },
  "payment": null
}
```

`depositAmount` is still calculated for the CRM's information, but the client is never asked for it.
