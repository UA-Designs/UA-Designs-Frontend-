const formatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format amount as ₱1,234,567 */
export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}

/** Abbreviate large amounts: ₱1.2M, ₱350K */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(0)}K`;
  return formatCurrency(amount);
}
