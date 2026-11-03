# Pricing rules

How the estimate is calculated. Code: `src/domain/pricing/`. Source: `6baf2c930_stima_prezzi_eventi.xlsx`, sheet "Prezzi per persona", generated into `table.v2.ts` as `pricing-v2`.

Version 2 changes the sheet in three places, as asked by the client: Brunch copies the Lunch row until it has its own prices, "I bring my own food" costs nothing, and Flowers and Balloons cost a flat £15 per person for every event type, Other/Bespoke included.

**The prices are not validated.** The sheet says they are a first working estimate, to be checked against real supplier quotes before use with clients. This blocks going live.

## Rules

| # | Rule | Source |
|---|---|---|
| R1 | Each event + item pair has a per-person range in GBP, or "On request" | Sheet, rows 3-22 |
| R2 | The per-person cost is the sum of the selected items, separately for lows and highs | Decision |
| R3 | Guests are the exact number on the slider, 10 to 100 | Decision |
| R4 | `totalLow` = sum of lows × guests. `totalHigh` = sum of highs × guests | Decision |
| R5 | `midpoint` = (`totalLow` + `totalHigh`) / 2 | Decision |
| R6 | `depositAmount` = 20% of `midpoint`, rounded to a whole pence | Decision |
| R7 | "On request" items are left out of the sum and listed apart. If others remain: `kind: partial`, deposit on the rest | Sheet note, row 27 + decision |
| R8 | With no priced item, including every Other/Bespoke event: `kind: on-request`, no amounts and no deposit | Column L + decision |
| R9 | "I bring my own drinks" covers service or corkage only, and the UI says so | Sheet note, row 28 |
| R9b | "I bring my own food" is free: it is neither a line nor an on-request item | Decision |
| R9c | Flowers and Balloons are £15 per person each, for every event type | Client, 3 Nov 2026 |
| R9d | Menus, drinks packages, service times and notes do not change the price | Client, 3 Nov 2026 |
| R10 | Date, times, budget and free text do not change the calculation | Assumption |
| R11 | Amounts are integer pence. The range shows whole pounds, the deposit shows pence when needed | Assumption |
| R12 | The estimate is always presented as indicative | Sheet note, row 29 + decision |

## Reference case

Wedding, 50 guests, Dinner, Wine only, DJ, Flowers:

- Lows: 50 + 14 + 11 + 15 = £90. Highs: 85 + 25 + 20 + 15 = £145.
- Totals: £90 × 50 = £4,500. £145 × 50 = £7,250.
- Midpoint: £5,875. Deposit: £1,175.

## Decision support

`analyseCostDrivers` powers the page shown when a client rejects the estimate. It reruns the calculation on what-if changes and uses no AI.

- **Drivers:** each priced item with its share of the midpoint.
- **Suggestions:** up to three, biggest saving first:
  - 10 fewer guests, never below 10
  - Next cheaper option in the same category
  - Removing an item, unless it is the only one in a required step (Food, Drinks)
- **Limits on suggestions:** each item offers only its best change. A suggestion never breaks an exclusion, never moves to an on-request item and never raises the estimate.
- **Budget gap:** midpoint minus the chosen budget. It is not shown at the top of the slider, "£20,000 or more". The budget informs the client but does not change the calculation.

"Next cheaper" means the smallest step down, not the cheapest option: Dinner moves to Brunch or Lunch (same price, Brunch comes first), not to Canapés.

Reference case, midpoint £5,875:

| Item | Amount | Share |
|---|---|---|
| Dinner | £3,375 | 57% |
| Wine only | £975 | 17% |
| DJ | £775 | 13% |
| Flowers | £750 | 13% |

Suggestions: Dinner to Brunch saves £1,375, 40 guests saves £1,175, removing the DJ saves £775. With a £5,000 budget, the gap is £875.

## Ambiguities in the sheet

1. **Unvalidated prices.** See above.
2. **Large-group discount.** Row 26 says the per-person cost tends towards the low value for large groups. This is not applied: the range already covers both ends.
3. **Fixed costs priced per person.** A DJ at a Birthday for 10 guests comes to £80-£150, probably below the real cost. We follow the sheet.
4. **Overlapping items.** "Drinks all" and a masterclass are added together. The sheet does not say whether one includes the other.
5. **Ranges.** With an exact number of guests the range only reflects the price range of each item: in the reference case the high is about 1.6 times the low.
6. **Single Other/Bespoke row.** Decorations "Other/Bespoke" is on request for every event, so choosing it always gives a partial estimate at best.
7. **Brunch prices.** The sheet has no Brunch row. It copies Lunch until real prices arrive.
8. **Flat decorations.** £15 per person for Flowers or Balloons is the same for 10 or 100 guests and for every event type.
