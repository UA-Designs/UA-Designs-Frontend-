import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spin, Typography, message } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { projectService } from '../../services/projectService';
import { costService, Cost } from '../../services/costService';
import type { Project } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { buildBoqTradeGroups } from './boqReportGrouping';
import './BoqReport.css';

const { Text } = Typography;

function formatPhp(n: number): string {
  return `Php ${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(n: number): string {
  return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const tradeGroups = useMemo(() => buildBoqTradeGroups(costs), [costs]);

  const totals = useMemo(() => {
    const laborSum = tradeGroups.reduce((s, g) => s + g.laborSum, 0);
    const materialSum = tradeGroups.reduce((s, g) => s + g.materialSum, 0);
    const amountSum = tradeGroups.reduce((s, g) => s + g.amount, 0);
    return { laborSum, materialSum, amountSum };
  }, [tradeGroups]);

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
          BOQ is grouped by <strong>trade category</strong>. Each trade uses <strong>lot</strong> for the summary line;{' '}
          <strong>materials</strong> under that trade are listed per quantity and unit (pc, box, sheet, etc.). Labor and equipment
          lines roll into the lump-sum columns for that trade.
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
              {tradeGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                    No BOQ items yet. Add lines on the project BOQ tab (choose a trade category for each line).
                  </td>
                </tr>
              ) : (
                tradeGroups.flatMap((g, gi) => {
                  const block: React.ReactNode[] = [];

                  block.push(
                    <tr key={`g-${gi}-main`} className="boq-trade-main-row">
                      <td className="col-no">{g.itemNo}</td>
                      <td className="col-desc">
                        <div className="boq-report-item-title">{g.trade.toUpperCase()}</div>
                        {g.scopeLines.length > 0 && (
                          <div className="boq-report-scope">
                            <div className="boq-report-scope-title">SCOPE OF WORKS</div>
                            <ol>
                              {g.scopeLines.map((line, i) => (
                                <li key={i}>{line}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {g.itemRows.length > 0 && (
                          <>
                            <hr className="boq-report-scope-mat-divider" />
                            <div className="boq-report-mat-title">Items</div>
                          </>
                        )}
                      </td>
                      <td className="col-qty">—</td>
                      <td className="col-unit">—</td>
                      <td className="col-money">—</td>
                      <td className="col-money">—</td>
                      <td className="col-money">—</td>
                      <td className="col-money">—</td>
                    </tr>,
                  );

                  g.itemRows.forEach((m, mi) => {
                    block.push(
                      <tr key={`g-${gi}-mat-${mi}`} className="boq-trade-mat-row">
                        <td className="col-no" />
                        <td className="col-desc boq-mat-indent">{m.name}</td>
                        <td className="col-qty">{formatQty(m.qty)}</td>
                        <td className="col-unit">{m.unit}</td>
                        <td className="col-money">{m.labor > 0 ? formatPhp(m.labor) : '—'}</td>
                        <td className="col-money">{m.material > 0 ? formatPhp(m.material) : '—'}</td>
                        <td className="col-money">{formatPhp(m.unitCost)}</td>
                        <td className="col-money">{formatPhp(m.amount)}</td>
                      </tr>,
                    );
                  });

                  block.push(
                    <tr key={`g-${gi}-subtotal`} className="boq-trade-subtotal-row">
                      <td className="col-no" />
                      <td className="col-desc"><strong>{`${g.trade.toUpperCase()} TOTAL`}</strong></td>
                      <td className="col-qty">—</td>
                      <td className="col-unit">—</td>
                      <td className="col-money"><strong>{g.laborSum > 0 ? formatPhp(g.laborSum) : '—'}</strong></td>
                      <td className="col-money"><strong>{g.materialSum > 0 ? formatPhp(g.materialSum) : '—'}</strong></td>
                      <td className="col-money"><strong>{formatPhp(g.unitCost)}</strong></td>
                      <td className="col-money"><strong>{formatPhp(g.amount)}</strong></td>
                    </tr>,
                  );

                  if (g.notes.length > 0) {
                    block.push(
                      <tr key={`g-${gi}-notes`} className="boq-trade-notes-row">
                        <td colSpan={8} className="boq-report-notes-cell">
                          {g.notes.map((n, i) => (
                            <div key={i}>
                              <em>Note: {n}</em>
                            </div>
                          ))}
                        </td>
                      </tr>,
                    );
                  }

                  return block;
                })
              )}
            </tbody>
          </table>
        </div>

        {tradeGroups.length > 0 && (
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
