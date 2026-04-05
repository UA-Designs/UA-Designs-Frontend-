import { BOQ_TRADE_CATEGORIES, getEffectiveTradeCategory } from '../../constants/boqTradeCategories';
import { Cost, CostType } from '../../services/costService';

/**
 * Best-effort quantity for a BOQ line (report + amount math).
 * Uses estimatedQty when &gt; 0; if missing/zero, derives from amount ÷ unitCost when possible.
 * Avoids forcing "1" when the API omits estimatedQty but amount and unit cost exist.
 */
export function resolveBoqLineQty(cost: Cost): number {
  const raw = cost.estimatedQty;
  if (raw != null && Number.isFinite(Number(raw)) && Number(raw) > 0) {
    return Number(raw);
  }
  const amt = Number(cost.amount);
  const uc = Number(cost.unitCost);
  if (amt > 0 && uc > 0) {
    return amt / uc;
  }
  if (raw != null && Number.isFinite(Number(raw))) {
    return Number(raw);
  }
  return 1;
}

/** Split a single cost line into labor vs material amounts (same rules as BOQ report). */
export function getCostLaborMaterialSplit(cost: Cost): { labor: number; material: number; lineAmount: number } {
  const qty = resolveBoqLineQty(cost);
  const lineAmount =
    Number(cost.amount) > 0 ? Number(cost.amount) : qty * (Number(cost.unitCost) || 0);

  let labor = cost.laborEquipmentCost != null ? Number(cost.laborEquipmentCost) : NaN;
  let material = cost.materialCost != null ? Number(cost.materialCost) : NaN;
  if (!Number.isFinite(labor)) labor = 0;
  if (!Number.isFinite(material)) material = 0;

  const t = String(cost.type || '').toUpperCase();
  const isMaterialCategory = t === CostType.MATERIAL || t === 'MATERIAL';
  const isFuel = t === CostType.FUEL || t === 'FUEL';
  const isLaborEquipmentCategory =
    t === CostType.LABOR ||
    t === 'LABOR' ||
    t === CostType.EQUIPMENT ||
    t === 'EQUIPMENT' ||
    t === CostType.FORMWORKS ||
    t === 'FORMWORKS' ||
    t === CostType.OVERHEAD ||
    t === 'OVERHEAD' ||
    t === CostType.OTHER ||
    t === 'OTHER';

  if (labor === 0 && material === 0 && lineAmount > 0) {
    if (isMaterialCategory || isFuel) material = lineAmount;
    else if (isLaborEquipmentCategory) labor = lineAmount;
    else material = lineAmount;
  }

  return { labor, material, lineAmount };
}

export function isMaterialBoqLineType(type: string | undefined): boolean {
  const t = String(type || '').toUpperCase();
  return t === CostType.MATERIAL || t === 'MATERIAL' || t === CostType.FUEL || t === 'FUEL';
}

/** Scope bullets: explicit scopeOfWorks + labor/equipment line names (not material SKUs). */
export function buildGroupScopeLines(items: Cost[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of items) {
    for (const s of c.scopeOfWorks || []) {
      const x = String(s).trim();
      if (x && !seen.has(x)) {
        seen.add(x);
        out.push(x);
      }
    }
  }
  for (const c of items) {
    if (!isMaterialBoqLineType(c.type) && c.name) {
      const x = c.name.trim();
      if (x && !seen.has(x)) {
        seen.add(x);
        out.push(x);
      }
    }
  }
  return out;
}

export interface BoqTradeGroup {
  trade: string;
  itemNo: string;
  laborSum: number;
  materialSum: number;
  unitCost: number;
  amount: number;
  scopeLines: string[];
  itemRows: {
    name: string;
    qty: number;
    unit: string;
    labor: number;
    material: number;
    unitCost: number;
    amount: number;
  }[];
  notes: string[];
}

export function buildBoqTradeGroups(costs: Cost[]): BoqTradeGroup[] {
  const order: string[] = [];
  const byTrade = new Map<string, Cost[]>();

  for (const c of costs) {
    const tr = getEffectiveTradeCategory(c, BOQ_TRADE_CATEGORIES);
    if (!byTrade.has(tr)) {
      byTrade.set(tr, []);
      order.push(tr);
    }
    byTrade.get(tr)!.push(c);
  }

  return order.map((trade, gi) => {
    const items = byTrade.get(trade)!;
    let laborSum = 0;
    let materialSum = 0;
    for (const c of items) {
      const s = getCostLaborMaterialSplit(c);
      laborSum += s.labor;
      materialSum += s.material;
    }
    const amount = laborSum + materialSum;
    const unitCost = amount;

    const scopeLines = buildGroupScopeLines(items);

    const itemRows = items.map(c => {
      const qty = resolveBoqLineQty(c);
      const t = String(c.type || '').toUpperCase();
      const defaultUnit = t === 'FUEL' ? 'l' : (isMaterialBoqLineType(c.type) ? 'pc' : 'lot');
      const unit = (c.unit && c.unit.trim()) || defaultUnit;
      const split = getCostLaborMaterialSplit(c);
      const amount = Number(split.lineAmount || 0);
      const unitCost = qty > 0 ? amount / qty : amount;
      return {
        name: c.name || '—',
        qty,
        unit,
        labor: Number(split.labor || 0),
        material: Number(split.material || 0),
        unitCost,
        amount,
      };
    });

    const notes: string[] = [];
    const seenN = new Set<string>();
    for (const c of items) {
      for (const n of c.exclusionNotes || []) {
        const x = String(n).trim();
        if (x && !seenN.has(x)) {
          seenN.add(x);
          notes.push(x);
        }
      }
    }

    return {
      trade,
      itemNo: `${gi + 1}.00`,
      laborSum,
      materialSum,
      unitCost,
      amount,
      scopeLines,
      itemRows,
      notes,
    };
  });
}
