# Pricing rules

How the estimate is calculated. Code: `src/domain/pricing/`. Source: `6baf2c930_stima_prezzi_eventi.xlsx`, sheet "Prezzi per persona", generated into `table.v3.ts` as `pricing-v3`.

Changes to the sheet, as asked by the client:

- Brunch copies the Lunch row until it has its own prices.
- "I bring my own food" costs nothing.
- Flowers and Balloons cost a flat £15 per person for every event type, Other/Bespoke included.
- Cocktails masterclass and Wine tasting are gone (v3).
- Bottles are priced by the bottle (v3): the Wine only row is zero, and the Drinks all row keeps only its cocktails, priced like Cocktails/spirits only.

**The prices are not validated.** The sheet says they are a first working estimate, to be checked against real supplier quotes before use with clients. The wine list is made up. This blocks going live.

## Rules

| # | Rule | Source |
|---|---|---|
| R1 | Each event + item pair has a per-person range in GBP, or "On request" | Sheet |
| R2 | The per-person cost is the sum of the selected items, separately for lows and highs | Decision |
| R3 | Guests come from the party size: 10-20, 20-40, 40-60, 60-80, 80-100 | Client |
| R4 | `totalLow` = sum of lows × minimum guests + bottles at the low quantity. `totalHigh` = sum of highs × maximum guests + bottles at the high quantity | Decision |
| R5 | `midpoint` = (`totalLow` + `totalHigh`) / 2 | Decision |
| R6 | `depositAmount` = 20% of `midpoint`, rounded to a whole pence. Kept for the CRM: clients are not asked for it | Client, 6 Nov 2026 |
| R7 | "On request" items are left out of the sum and listed apart. If others remain: `kind: partial` | Sheet note, row 27 + decision |
| R8 | With nothing priced: `kind: on-request`, no amounts | Column L + decision |
| R9 | "I bring my own drinks" covers service or corkage only, and the UI says so | Sheet note, row 28 |
| R9b | "I bring my own food" is free: it is neither a line nor an on-request item | Decision |
| R9c | Flowers and Balloons are £15 per person each, for every event type | Client, 3 Nov 2026 |
| R9d | Menus, number of cocktails, glass sizes, service times and notes do not change the price | Client |
| R9e | Wine only costs the bottles the client picked: price × quantity, the same at both ends | Client, 6 Nov 2026 |
| R9f | Drinks all costs its cocktails per person, plus 1 bottle per guest with 4 cocktails, ½ otherwise, rounded up, for the minimum and maximum guests | Client + decision |
| R10 | Date, times, budget and free text do not change the calculation | Assumption |
| R11 | Amounts are integer pence. The range shows whole pounds | Assumption |
| R12 | The estimate is always presented as indicative | Sheet note, row 29 + decision |

## Reference case

Wedding, From 40 to 60, Dinner, Wine only with 10 bottles of House Red (£16), DJ, Flowers:

- Lows: 50 + 11 + 15 = £76 per person. Highs: 85 + 20 + 15 = £120.
- Bottles: 10 × £16 = £160.
- Totals: £76 × 40 + £160 = £3,200. £120 × 60 + £160 = £7,360.
- Midpoint: £5,280.

## Decision support

`analyseCostDrivers` powers the page shown when a client rejects the estimate. It reruns the calculation on what-if changes and uses no AI.

- **Drivers:** each priced item with its share of the midpoint. Bottles count towards their drink.
- **Suggestions:** up to three, biggest saving first:
  - The next smaller party size
  - The next cheaper option in the same category
  - Removing an item, unless it is the only one in a required step (Food, Drinks)
- **Limits on suggestions:** each item offers only its best change. A suggestion never breaks an exclusion, never moves to an on-request item, never moves to Wine only or Drinks all (their bottles are not picked yet) and never raises the estimate.
- **Budget gap:** midpoint minus the chosen budget. It is not shown at the top of the slider, "£20,000 or more".

"Next cheaper" means the smallest step down, not the cheapest option: Dinner moves to Brunch or Lunch (same price, Brunch comes first), not to Canapés.

Reference case, midpoint £5,280:

| Item | Amount | Share |
|---|---|---|
| Dinner | £3,550 | 67% |
| DJ | £820 | 16% |
| Flowers | £750 | 14% |
| Wine only | £160 | 3% |

Suggestions: From 20 to 40 saves £1,960, Dinner to Brunch saves £1,450, removing the DJ saves £820. With a £5,000 budget, the gap is £280.

## Ambiguities

1. **Unvalidated prices.** See above.
2. **Large-group discount.** Row 26 says the per-person cost tends towards the low value for large groups. This is not applied: the range already covers both ends.
3. **Fixed costs priced per person.** A DJ at a Birthday for 10 guests comes to £80-£150, probably below the real cost. We follow the sheet.
4. **Wide ranges.** The high total combines high prices with the maximum guests: in the reference case the high is about 2.3 times the low.
5. **Single Other/Bespoke row.** Decorations "Other/Bespoke" is on request for every event, so choosing it always gives a partial estimate at best.
6. **Brunch prices.** The sheet has no Brunch row. It copies Lunch until real prices arrive.
7. **Flat decorations.** £15 per person for Flowers or Balloons is the same for 10 or 100 guests and for every event type.
8. **Drinks all.** Its sheet price covered everything; now its cocktails are priced like Cocktails/spirits only and the bottles on top. Service for Wine only (glassware, staff) has no price of its own.
9. **Wine only quantities.** The client chooses how many bottles; nothing checks that they are enough for the guests.
