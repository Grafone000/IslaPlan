// Amounts are integer pence. Whole pounds drop the decimals, as the estimate range needs.
export function formatMoney(amountMinor: number): string {
  const whole = amountMinor % 100 === 0;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountMinor / 100);
}
