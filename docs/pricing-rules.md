# Pricing rules

How the estimate is calculated. Code: `src/domain/pricing/`. Source: `6baf2c930_stima_prezzi_eventi.xlsx`, sheet "Prezzi per persona", generated into `table.v1.ts` as `pricing-v1`.

**The prices are not validated.** The sheet says they are a first working estimate, to be checked against real supplier quotes before use with clients. This blocks going live.

## Rules

| # | Rule | Source |
|---|---|---|
| R1 | Each event + item pair has a per-person range in GBP, or "On request" | Sheet, rows 3-22 |
| R2 | The per-person cost is the sum of the selected items, separately for lows and highs | Decision |
| R3 | Guests come from the party size: 10-20, 20-40, 40-60, 60-80, 80-100 | Decision |
| R4 | `totalLow` = sum of lows × minimum guests. `totalHigh` = sum of highs × maximum guests | Decision |
| R5 | `midpoint` = (`totalLow` + `totalHigh`) / 2 | Decision |
| R6 | `depositAmount` = 20% of `midpoint`, rounded to a whole pence | Decision |
| R7 | "On request" items are left out of the sum and listed apart. If others remain: `kind: partial`, deposit on the rest | Sheet note, row 27 + decision |
| R8 | With no priced item, including every Other/Bespoke event: `kind: on-request`, no amounts and no deposit | Column L + decision |
| R9 | "I bring my own drinks" covers service or corkage only, and the UI says so | Sheet note, row 28 |
| R10 | Date, times, budget and free text do not change the calculation | Assumption |
| R11 | Amounts are integer pence. The range shows whole pounds, the deposit shows pence when needed | Assumption |
| R12 | The estimate is always presented as indicative | Sheet note, row 29 + decision |

## Reference case

Wedding, From 40 to 60, Dinner, Wine only, DJ, Flowers:

- Lows: 50 + 14 + 11 + 9 = £84. Highs: 85 + 25 + 20 + 20 = £150.
- Totals: £84 × 40 = £3,360. £150 × 60 = £9,000.
- Midpoint: £6,180. Deposit: £1,236.

## Decision support

`analyseCostDrivers` powers the page shown when a client rejects the estimate. It reruns the calculation on what-if changes and uses no AI.

- **Drivers:** each priced item with its share of the midpoint.
- **Suggestions:** up to three, biggest saving first:
  - Next smaller party size
  - Next cheaper option in the same category
  - Removing an item, unless it is the only one in a required step (Food, Drinks)
- **Limits on suggestions:** each item offers only its best change. A suggestion never breaks an exclusion, never moves to an on-request item and never raises the estimate.
- **Budget gap:** midpoint minus the top of the chosen budget band. It is not shown for "Over £10,000". The budget informs the client but does not change the calculation.

"Next cheaper" means the smallest step down, not the cheapest option: Dinner moves to Lunch, not to Canapes.

Reference case, midpoint £6,180:

| Item | Amount | Share |
|---|---|---|
| Dinner | £3,550 | 57% |
| Wine only | £1,030 | 17% |
| DJ | £820 | 13% |
| Flowers | £780 | 13% |

Suggestions: From 20 to 40 saves £2,340, Dinner to Lunch saves £1,450, removing the DJ saves £820. With a £2,500-£5,000 budget, the gap is £1,180.

## Ambiguities in the sheet

1. **Unvalidated prices.** See above.
2. **Large-group discount.** Row 26 says the per-person cost tends towards the low value for large groups. This is not applied: the range already covers both ends.
3. **Fixed costs priced per person.** A DJ at a Birthday for 10 guests comes to £80-£150, probably below the real cost. We follow the sheet.
4. **Overlapping items.** "Drinks all" and a masterclass are added together. The sheet does not say whether one includes the other.
5. **Wide ranges.** The high total combines the high price with the maximum guests, so the range is wide: in the reference case the high is about 2.7 times the low.
6. **Single Other/Bespoke row.** Decorations "Other/Bespoke" is on request for every event, so choosing it always gives a partial estimate at best.
