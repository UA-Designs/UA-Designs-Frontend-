/**
 * Safe domain for Recharts axes. getNiceTickValues throws when min/max are NaN
 * or when min === max (zero-width domain). Returns [min, max] with max > min.
 */
export function getSafeDomain(values: number[], defaultMin = 0, defaultMax = 1): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [defaultMin, defaultMax];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return [min, min + 1];
  return [min, max];
}
