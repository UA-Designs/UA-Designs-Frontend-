import { BOQ_TRADE_CATEGORIES } from '../constants/boqTradeCategories';

/** Material catalog categories — aligned with BOQ trade disciplines. */
export const MATERIAL_CATEGORIES = [...BOQ_TRADE_CATEGORIES] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const DEFAULT_MATERIAL_CATEGORY: MaterialCategory = 'Structural';

/** Legacy catalog labels (pre–trade-category migration) → current discipline. */
const LEGACY_CATEGORY_MAP: Record<string, MaterialCategory> = {
  other: 'Structural',
  'steel & metal': 'Structural',
  'steel and metal': 'Structural',
  'wood & lumber': 'Structural',
  'wood and lumber': 'Structural',
  'cement & concrete': 'Structural',
  'cement and concrete': 'Structural',
  roofing: 'Architectural',
  'tiles works': 'Architectural',
  'paint works': 'Architectural',
  'doors & windows': 'Architectural',
  'doors and windows': 'Architectural',
  'ceiling works': 'Architectural',
  'plastering works': 'Architectural',
  'masonry works': 'Architectural',
  'concrete work': 'Structural',
  'rsb works': 'Structural',
  earthworks: 'Structural',
  'gen requirements': 'Structural',
  'electrical works': 'Electrical',
  'plumbing works': 'Plumbing',
};

const TYPO_MAP: Record<string, MaterialCategory> = {
  archetectural: 'Architectural',
  architectual: 'Architectural',
  architecural: 'Architectural',
  structual: 'Structural',
  structral: 'Structural',
  mechnical: 'Mechanical',
  mechancial: 'Mechanical',
  mecanical: 'Mechanical',
};

/**
 * Map API / legacy strings to a canonical discipline label.
 * Does not treat cost line types (e.g. "MATERIAL") as catalog categories.
 */
export function normalizeMaterialCategory(raw?: string | null): MaterialCategory | string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return DEFAULT_MATERIAL_CATEGORY;

  const upper = trimmed.toUpperCase();
  if (upper === 'MATERIAL' || upper === 'LABOR' || upper === 'EQUIPMENT' || upper === 'FUEL') {
    return DEFAULT_MATERIAL_CATEGORY;
  }

  const exact = MATERIAL_CATEGORIES.find((c) => c === trimmed);
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  const caseInsensitive = MATERIAL_CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (caseInsensitive) return caseInsensitive;

  const typo = TYPO_MAP[lower];
  if (typo) return typo;

  const legacy = LEGACY_CATEGORY_MAP[lower];
  if (legacy) return legacy;

  return trimmed;
}

export function isKnownMaterialCategory(value: string): value is MaterialCategory {
  return (MATERIAL_CATEGORIES as readonly string[]).includes(value);
}

/** Read catalog discipline from API row (camelCase or snake_case, category or tradeCategory). */
export function getMaterialCategoryFromRecord(record: Record<string, unknown>): MaterialCategory | string {
  const raw =
    record.category ??
    record.materialCategory ??
    record.material_category ??
    record.tradeCategory ??
    record.trade_category;
  const str =
    typeof raw === 'string' ? raw : raw != null && raw !== '' ? String(raw) : undefined;
  return normalizeMaterialCategory(str);
}

export function normalizeMaterialRecord<T extends Record<string, unknown>>(raw: T): T & { category: string } {
  const category = getMaterialCategoryFromRecord(raw);
  return { ...raw, category };
}
