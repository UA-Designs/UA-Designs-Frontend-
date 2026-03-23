import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spin, Typography, message } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { projectService } from '../../services/projectService';
import { costService, Cost, CostType } from '../../services/costService';
import type { Project } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import './BoqReport.css';

const { Text } = Typography;

function formatPhp(n: number): string {
  return `Php ${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * BOQ report row mapping:
 * - Labor & equipment → lump sum (lot / l.s.): one package price, qty usually 1.
 * - Materials → per piece / per unit (pc, sheet, sq.m., etc.): qty × unit reflects takeoff.
 * API laborEquipmentCost / materialCost override inference when both are set.
 */
export function mapCostToBoqReportRow(cost: Cost, index: number) {
  let qty = cost.estimatedQty != null && cost.estimatedQty > 0 ? cost.estimatedQty : 1;
  let unit = (cost.unit && String(cost.unit).trim()) || '';

  const lineAmount =
    Number(cost.amount) > 0
      ? Number(cost.amount)
      : qty * (Number(cost.unitCost) || 0);

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
    if (isMaterialCategory || isFuel) {
      material = lineAmount;
    } else if (isLaborEquipmentCategory) {
      labor = lineAmount;
    } else {
      material = lineAmount;
    }
  }

  const materialOnly = material > 0 && labor === 0;
  const laborOnly = labor > 0 && material === 0;
  const mixedLaborAndMaterial = labor > 0 && material > 0;

  // Units: materials → per piece / measured unit; labor & equipment → lump sum (lot / l.s.)
  if (!unit) {
    if (materialOnly) {
      unit = isFuel ? 'l' : 'pc';
    } else if (laborOnly) {
      unit = 'lot';
    } else if (mixedLaborAndMaterial) {
      unit = 'lot';
    } else {
      unit = 'lot';
    }
  }

  // Lump-sum labor & equipment rows: qty 1 unless user explicitly entered another qty
  if (laborOnly || mixedLaborAndMaterial) {
    const hasExplicitQty = cost.estimatedQty != null && cost.estimatedQty > 0;
    if (!hasExplicitQty) {
      qty = 1;
    }
  }

  const unitCost = labor + material;
  const amountCol = lineAmount > 0 ? lineAmount : unitCost * qty;

  const itemNo = cost.itemNumber?.trim() || `${(index + 1).toFixed(2)}`;

  const scope =
    cost.scopeOfWorks && cost.scopeOfWorks.length > 0
      ? cost.scopeOfWorks
      : cost.description
        ? cost.description
            .split(/\n+/)
            .map(s => s.trim())
            .filter(Boolean)
        : [];

  const materialLines = cost.materialLines && cost.materialLines.length > 0 ? cost.materialLines : [];

  const notes = cost.exclusionNotes && cost.exclusionNotes.length > 0 ? cost.exclusionNotes : [];

  return {
    itemNo,
    title: cost.name || '—',
    qty,
    unit,
    labor,
    material,
    unitCost: unitCost > 0 ? unitCost : amountCol / (qty || 1),
    amount: amountCol,
    scope,
    materialLines,
    notes,
  };
}

const BoqReport: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, allCosts] = await Promise.all([
        projectService.getProjectById(projectId),
        costService.getCosts().catch(() => []),
      ]);
      setProject(proj);
      const pid = String(projectId).toLowerCase();
      const list = (allCosts || []).filter(
        c => String((c.projectId ?? (c as any).project_id) ?? '').toLowerCase() === pid,
      );
      list.sort((a, b) => {
        const sa = a.sortOrder ?? 1e9;
        const sb = b.sortOrder ?? 1e9;
        if (sa !== sb) return sa - sb;
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return ta - tb;
      });
      setCosts(list);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load BOQ report');
      setProject(null);
      setCosts([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => costs.map((c, i) => mapCostToBoqReportRow(c, i)), [costs]);

  const totals = useMemo(() => {
    const laborSum = rows.reduce((s, r) => s + r.labor, 0);
    const materialSum = rows.reduce((s, r) => s + r.material, 0);
    const amountSum = rows.reduce((s, r) => s + r.amount, 0);
    return { laborSum, materialSum, amountSum };
  }, [rows]);

  const proposedTotal = useMemo(() => {
    const p = project as Project & { boqProposedTotal?: number };
    if (p?.boqProposedTotal != null && Number(p.boqProposedTotal) > 0) {
      return Number(p.boqProposedTotal);
    }
    if (project?.budget != null && project.budget > 0) {
      return project.budget;
    }
    return totals.amountSum;
  }, [project, totals.amountSum]);

  const handlePrint = () => {
    window.print();
  };

  const preparerName =
    (user as any)?.fullName ||
    (user as any)?.name ||
    [((user as any)?.firstName || ''), ((user as any)?.lastName || '')].filter(Boolean).join(' ') ||
    (user as any)?.email ||
    '—';

  const floorTotal = (project as Project & { floorAreaTotalSqm?: number })?.floorAreaTotalSqm;
  const floorBreakdown = (project as Project & { floorAreaBreakdown?: { label: string; sqm?: number | null }[] })
    ?.floorAreaBreakdown;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: 24 }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')} style={{ color: '#009944' }}>
          Back to projects
        </Button>
        <Text style={{ display: 'block', marginTop: 16, color: '#fff' }}>Project not found.</Text>
      </div>
    );
  }

  return (
    <div className="boq-report-page">
      <div className="boq-report-toolbar">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/projects/${projectId}`)}>
          Back to project
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} style={{ background: '#009944', borderColor: '#009944' }}>
          Print / Save as PDF
        </Button>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
          Use your browser&apos;s print dialog → choose &quot;Save as PDF&quot; to download.
        </Text>
      </div>

      <div className="boq-report-document">
        <h1>Bill of Quantities</h1>
        <p className="boq-report-convention">
          Labor and equipment costs are shown as <strong>lump sum</strong> (lot / l.s.). Material quantities are{' '}
          <strong>per piece</strong> or per listed unit (pc, sheet, sq.m., etc.).
        </p>

        <div className="boq-report-meta">
          <div className="boq-report-meta-row">
            <span>
              <span className="boq-report-meta-label">Project Title: </span>
              {project.name}
            </span>
          </div>
          {project.location && (
            <div className="boq-report-meta-row">
              <span>
                <span className="boq-report-meta-label">Location: </span>
                {project.location}
              </span>
            </div>
          )}
          {project.clientName && (
            <div className="boq-report-meta-row">
              <span>
                <span className="boq-report-meta-label">Owner: </span>
                {project.clientName}
              </span>
            </div>
          )}

          {(floorTotal != null || (floorBreakdown && floorBreakdown.length > 0)) && (
            <div className="boq-report-floor">
              {floorTotal != null && (
                <div>
                  <span className="boq-report-meta-label">Total Floor Area Affected: </span>
                  {Number(floorTotal).toLocaleString('en-PH', { maximumFractionDigits: 2 })} sq.m.
                </div>
              )}
              {floorBreakdown && floorBreakdown.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {floorBreakdown.map((f, i) => (
                    <span key={i} style={{ marginRight: 16 }}>
                      {f.label}
                      {f.sqm != null ? ` (${Number(f.sqm).toLocaleString('en-PH', { maximumFractionDigits: 2 })})` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="boq-report-table-wrap">
          <table className="boq-report-table">
            <thead>
              <tr>
                <th className="col-no">Item No.</th>
                <th className="col-desc">Item Description</th>
                <th className="col-qty">qty</th>
                <th className="col-unit">unit</th>
                <th className="col-money">Labor and Equipment Cost</th>
                <th className="col-money">Material Cost</th>
                <th className="col-money">Unit Cost</th>
                <th className="col-money">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                    No BOQ items yet. Add lines on the project BOQ tab — they will appear here automatically.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="col-no">{r.itemNo}</td>
                    <td className="col-desc">
                      <div className="boq-report-item-title">{r.title}</div>
                      {r.scope.length > 0 && (
                        <div className="boq-report-scope">
                          <div className="boq-report-scope-title">SCOPE OF WORKS</div>
                          <ol>
                            {r.scope.map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {r.materialLines.length > 0 && (
                        <div>
                          <div className="boq-report-mat-title">Materials to be use</div>
                          {r.materialLines.map((m, i) => (
                            <div key={i} className="boq-report-mat-line">
                              {m.name}
                              {m.quantity != null && (
                                <>
                                  {' '}
                                  | {Number(m.quantity).toLocaleString('en-PH', { maximumFractionDigits: 2 })}{' '}
                                  {m.unit || ''}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {r.notes.length > 0 && (
                        <div className="boq-report-notes">
                          {r.notes.map((n, i) => (
                            <div key={i}>
                              Note: {n}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="col-qty">{r.qty.toLocaleString('en-PH', { maximumFractionDigits: 2 })}</td>
                    <td className="col-unit">{r.unit}</td>
                    <td className="col-money">{r.labor > 0 ? formatPhp(r.labor) : '—'}</td>
                    <td className="col-money">{r.material > 0 ? formatPhp(r.material) : '—'}</td>
                    <td className="col-money">{formatPhp(r.unitCost)}</td>
                    <td className="col-money">{formatPhp(r.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {rows.length > 0 && (
          <div className="boq-report-footer">
            <div className="boq-report-footer-row">
              <span>Labor and Equipment Cost</span>
              <span>{formatPhp(totals.laborSum)}</span>
            </div>
            <div className="boq-report-footer-row" style={{ textDecoration: 'underline' }}>
              <span>Materials Cost</span>
              <span>{formatPhp(totals.materialSum)}</span>
            </div>
            <div className="boq-report-footer-total">
              <div className="boq-report-footer-row">
                <span>Total</span>
                <span>{formatPhp(totals.laborSum + totals.materialSum)}</span>
              </div>
            </div>
            <div className="boq-report-footer-proposed">
              <div className="boq-report-footer-row">
                <span>PROJECT COST (PROPOSED)</span>
                <span>{formatPhp(proposedTotal)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="boq-report-signoff">
          <div style={{ marginBottom: 4 }}>Prepared by:</div>
          <div style={{ fontWeight: 700 }}>{preparerName}</div>
          <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 8, color: '#666' }}>
            Professional credentials (PRC / PTR) can be added to your profile when the API supports them.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default BoqReport;
