import { formatCurrency } from '../../utils/formatCurrency';

export function fmtPhp(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return 'n/a';
  return formatCurrency(Number(value));
}

export function fmtIndex(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return 'n/a';
  return Number(value).toFixed(2);
}

export function fmtNumber(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(Number(value))) return 'n/a';
  return Number(value).toLocaleString('en-PH', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return 'n/a';
  return `${Number(value).toFixed(1)}%`;
}

export function fmtDays(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return 'n/a';
  const n = Number(value);
  const abs = Math.abs(n);
  const unit = abs === 1 ? 'day' : 'days';
  return `${n > 0 ? '+' : ''}${n} ${unit}`;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return 'n/a';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'n/a';
  return parsed.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function safeChartNum(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function forecastStatusColor(
  status: string | null | undefined
): 'success' | 'warning' | 'error' | 'default' {
  switch ((status || '').toUpperCase()) {
    case 'ON_TRACK':
      return 'success';
    case 'AT_RISK':
      return 'warning';
    case 'OVER_BUDGET':
    case 'DELAYED':
    case 'SHORTAGE':
      return 'error';
    case 'INSUFFICIENT_DATA':
    case 'UNAVAILABLE':
    default:
      return 'default';
  }
}

export function forecastStatusLabel(status: string | null | undefined): string {
  if (!status) return 'n/a';
  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
}
