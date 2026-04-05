/** Trade categories for BOQ grouping (formal BOQ / report). */
export const BOQ_TRADE_CATEGORIES = [
  'Structural',
  'Architectural',
  'Mechanical',
  'Electrical',
  'Plumbing',
  'Fire Protection',
] as const;

export type BoqTradeCategory = (typeof BOQ_TRADE_CATEGORIES)[number];

/**
 * Effective trade for grouping: API field, or legacy description prefix "Trade — ...",
 * or fallback bucket.
 */
export function getEffectiveTradeCategory(
  cost: { tradeCategory?: string; description?: string | null },
  categories: readonly string[] = BOQ_TRADE_CATEGORIES,
): string {
  const tc = (cost.tradeCategory || '').trim();
  if (tc) return tc;
  const desc = cost.description?.trim();
  if (desc && desc.includes(' — ')) {
    const prefix = desc.split(' — ')[0].trim();
    if (categories.includes(prefix)) return prefix;
  }
  return 'General / Uncategorized';
}
