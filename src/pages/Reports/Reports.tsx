import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Select, Typography, Button, Space, Tag, Spin,
  Statistic, Empty, Table, message, Grid,
} from 'antd';
import {
  FileTextOutlined, DownloadOutlined, ReloadOutlined,
  DollarOutlined, ExclamationCircleOutlined, TeamOutlined,
  CalendarOutlined, UsergroupAddOutlined, BarChartOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useProject } from '../../contexts/ProjectContext';
import { costService } from '../../services/costService';
import { riskService } from '../../services/riskService';
import { stakeholderService } from '../../services/stakeholderService';
import { scheduleService } from '../../services/scheduleService';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// ── styles ────────────────────────────────────────────────────────────────────
const cardStyle = { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 };
const GREEN = '#009944';

// ── XLSX helpers ──────────────────────────────────────────────────────────────

/** Recursively flatten a nested object into dot-notated keys */
const flattenObj = (obj: any, prefix = ''): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenObj(v, key));
    } else if (Array.isArray(v)) {
      result[key] = v.length <= 5 ? v.map(i => (typeof i === 'object' ? JSON.stringify(i) : i)).join(', ') : `${v.length} items`;
    } else {
      result[key] = v;
    }
  }
  return result;
};

/** Turn a camelCase/dot.path key into "Title Case" header */
const humanize = (key: string): string =>
  key
    .replace(/\./g, ' › ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

/** Format a value for display in a cell */
const formatCellValue = (v: any): string | number => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    // ISO date strings
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return v;
  }
  return String(v);
};

/** Auto-fit column widths based on content */
const autoFitColumns = (ws: XLSX.WorkSheet) => {
  const ref = ws['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const colWidths: number[] = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    let maxLen = 10;
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell?.v != null) {
        const len = String(cell.v).length;
        if (len > maxLen) maxLen = len;
      }
    }
    colWidths.push(Math.min(maxLen + 2, 50));
  }
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
};

/**
 * Build a well-formatted worksheet from API data.
 * - Scalar top-level fields → "Summary" key-value pairs at the top
 * - Arrays of objects → tabular sections below, each with a title row
 */
const buildWorksheet = (data: any, reportTitle: string, projectName: string): XLSX.WorkSheet => {
  const rows: any[][] = [];

  // Title rows
  rows.push([reportTitle]);
  rows.push([`Project: ${projectName}`]);
  rows.push([`Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`]);
  rows.push([]); // blank separator

  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    rows.push(['No data available for this report.']);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    autoFitColumns(ws);
    return ws;
  }

  // Separate scalars from arrays/objects
  const scalars: [string, any][] = [];
  const arrays: [string, any[]][] = [];
  const nestedObjects: [string, any][] = [];

  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      arrays.push([k, v]);
    } else if (v !== null && typeof v === 'object') {
      nestedObjects.push([k, v]);
    } else {
      scalars.push([k, v]);
    }
  }

  // SECTION 1: Scalar Summary
  if (scalars.length > 0 || nestedObjects.length > 0) {
    rows.push(['SUMMARY']);
    rows.push(['Metric', 'Value']);

    for (const [k, v] of scalars) {
      rows.push([humanize(k), formatCellValue(v)]);
    }

    // Flatten nested objects into the summary
    for (const [parentKey, obj] of nestedObjects) {
      const flat = flattenObj(obj);
      for (const [k, v] of Object.entries(flat)) {
        rows.push([humanize(`${parentKey}.${k}`), formatCellValue(v)]);
      }
    }

    rows.push([]); // blank separator
  }

  // SECTION 2: Arrays as tables
  for (const [arrayKey, arr] of arrays) {
    if (!arr.length) continue;

    rows.push([humanize(arrayKey).toUpperCase()]);

    if (typeof arr[0] === 'object' && arr[0] !== null) {
      // Flatten each row to handle nested objects inside arrays
      const flatRows = arr.map(item => flattenObj(item));
      // Collect all unique keys across all rows
      const allKeys = [...new Set(flatRows.flatMap(r => Object.keys(r)))];
      // Filter out internal fields
      const headers = allKeys.filter(k => !['__v', 'isDeleted', 'deletedAt'].includes(k));

      rows.push(headers.map(humanize));
      for (const flatRow of flatRows) {
        rows.push(headers.map(h => formatCellValue(flatRow[h])));
      }
    } else {
      // Primitive array
      rows.push(['Value']);
      for (const item of arr) {
        rows.push([formatCellValue(item)]);
      }
    }

    rows.push([]); // blank separator
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  autoFitColumns(ws);

  // Merge the title row across columns
  const maxCols = Math.max(...rows.map(r => r.length), 1);
  if (maxCols > 1) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } }, // title
      { s: { r: 1, c: 0 }, e: { r: 1, c: maxCols - 1 } }, // project
      { s: { r: 2, c: 0 }, e: { r: 2, c: maxCols - 1 } }, // date
    ];
  }

  return ws;
};

/** Export a single report's data to a well-formatted XLSX file */
const exportToXlsx = (data: any, sheetName: string, filename: string, projectName: string) => {
  try {
    if (!data) { message.warning('No data to export'); return; }
    const ws = buildWorksheet(data, sheetName, projectName);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${filename}.xlsx`);
    message.success(`Exported ${filename}.xlsx`);
  } catch (err) {
    console.error('XLSX export error:', err);
    message.error('Export failed — see console for details');
  }
};

/** Export ALL generated reports into a single workbook with multiple sheets */
const exportAllToXlsx = (
  reportDefs: ReportDef[],
  reportState: Record<string, { data: any; loading: boolean; generated: boolean; error?: string }>,
  projectName: string,
  projectId: string,
) => {
  try {
    const wb = XLSX.utils.book_new();
    let sheetCount = 0;

    for (const def of reportDefs) {
      const state = reportState[def.key];
      if (!state?.generated || state.error || !state.data) continue;
      const ws = buildWorksheet(state.data, def.title, projectName);
      XLSX.utils.book_append_sheet(wb, ws, def.sheetName.substring(0, 31));
      sheetCount++;
    }

    if (sheetCount === 0) { message.warning('No reports generated yet'); return; }

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `Reports_${safeName}_${projectId.substring(0, 8)}.xlsx`);
    message.success(`Exported ${sheetCount} report(s) to a single workbook`);
  } catch (err) {
    console.error('XLSX bulk export error:', err);
    message.error('Bulk export failed');
  }
};

// ── report definition ─────────────────────────────────────────────────────────
interface ReportDef {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fetch: (projectId: string) => Promise<any>;
  sheetName: string;
}

/**
 * Generate a single "Project Summary" workbook with the most important data
 * across all PMBOK knowledge areas — fetched fresh, no need to generate
 * individual reports first.
 */
const generateProjectSummaryExport = async (project: any) => {
  const pid = project.id;
  const projectName = project.name ?? 'Project';
  const hide = message.loading('Generating project summary…', 0);

  try {
    // Fetch all critical data in parallel — settle so partial failures don't block the whole export
    const [costRes, evmRes, forecastRes, riskRes, scheduleRes, stakeholderRes, expenseRes] =
      await Promise.allSettled([
        costService.getCostOverview(pid),
        costService.getEVM(pid),
        costService.getCostForecast(pid),
        riskService.getRiskReport(pid),
        scheduleService.getProjectSchedule(pid),
        stakeholderService.getSummary(pid),
        costService.getExpenseSummary(pid),
      ]);

    const val = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === 'fulfilled' ? r.value : null);
    const cost      = val(costRes);
    const evm       = val(evmRes);
    const forecast  = val(forecastRes);
    const risk      = val(riskRes);
    const schedule  = val(scheduleRes);
    const stakeholder = val(stakeholderRes);
    const expenses  = val(expenseRes);

    const wb = XLSX.utils.book_new();
    const now = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ── Sheet 1: Project Overview ─────────────────────────────────────────
    const overviewRows: any[][] = [
      ['PROJECT SUMMARY REPORT'],
      [`Project: ${projectName}`],
      [`Generated: ${now}`],
      [],
      ['PROJECT DETAILS'],
      ['Field', 'Value'],
      ['Name', project.name ?? '—'],
      ['Project Number', project.projectNumber ?? '—'],
      ['Status', project.status ?? '—'],
      ['Phase', project.phase ?? '—'],
      ['Priority', project.priority ?? '—'],
      ['Type', project.projectType ?? '—'],
      ['Client', project.clientName ?? '—'],
      ['Location', project.location ?? '—'],
      ['Start Date', project.startDate ? new Date(project.startDate).toLocaleDateString('en-PH') : '—'],
      ['End Date', project.endDate ? new Date(project.endDate).toLocaleDateString('en-PH') : '—'],
      ['Progress', project.progress != null ? `${project.progress}%` : '—'],
      ['Budget', project.budget != null ? `₱${Number(project.budget).toLocaleString()}` : '—'],
      ['Actual Cost', project.actualCost != null ? `₱${Number(project.actualCost).toLocaleString()}` : '—'],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
    wsOverview['!cols'] = [{ wch: 22 }, { wch: 40 }];
    wsOverview['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Project Overview');

    // ── Sheet 2: Financial Summary ────────────────────────────────────────
    const finRows: any[][] = [
      ['FINANCIAL SUMMARY'],
      [`Project: ${projectName}`],
      [],
    ];
    if (cost) {
      finRows.push(['COST OVERVIEW'], ['Metric', 'Value']);
      const flat = flattenObj(cost);
      for (const [k, v] of Object.entries(flat)) {
        finRows.push([humanize(k), formatCellValue(v)]);
      }
      finRows.push([]);
    }
    if (evm) {
      finRows.push(['EARNED VALUE METRICS'], ['Metric', 'Value']);
      const flat = flattenObj(evm);
      for (const [k, v] of Object.entries(flat)) {
        finRows.push([humanize(k), formatCellValue(v)]);
      }
      finRows.push([]);
    }
    if (forecast) {
      finRows.push(['FORECAST'], ['Metric', 'Value']);
      const flat = flattenObj(forecast);
      for (const [k, v] of Object.entries(flat)) {
        finRows.push([humanize(k), formatCellValue(v)]);
      }
      finRows.push([]);
    }
    if (finRows.length <= 3) {
      finRows.push(['No financial data available.']);
    }
    const wsFin = XLSX.utils.aoa_to_sheet(finRows);
    autoFitColumns(wsFin);
    XLSX.utils.book_append_sheet(wb, wsFin, 'Financial Summary');

    // ── Sheet 3: Risk Summary ─────────────────────────────────────────────
    const riskRows: any[][] = [
      ['RISK SUMMARY'],
      [`Project: ${projectName}`],
      [],
    ];
    if (risk) {
      // Summary scalars
      const summary = (risk as any).summary ?? risk;
      const summaryFlat = flattenObj(typeof summary === 'object' && !Array.isArray(summary) ? summary : {});
      if (Object.keys(summaryFlat).length > 0) {
        riskRows.push(['SUMMARY'], ['Metric', 'Value']);
        for (const [k, v] of Object.entries(summaryFlat)) {
          riskRows.push([humanize(k), formatCellValue(v)]);
        }
        riskRows.push([]);
      }

      // Risks table
      const risksArr: any[] = (risk as any).risks ?? [];
      if (risksArr.length > 0) {
        riskRows.push(['RISKS']);
        const riskFields = ['title', 'severity', 'status', 'probability', 'impact', 'riskScore', 'identifiedDate'];
        riskRows.push(riskFields.map(humanize));
        for (const r of risksArr) {
          riskRows.push(riskFields.map(f => formatCellValue(r[f])));
        }
        riskRows.push([]);
      }

      // Mitigations summary
      const mitigations = (risk as any).mitigations;
      if (mitigations && typeof mitigations === 'object') {
        riskRows.push(['MITIGATION PROGRESS'], ['Metric', 'Value']);
        const mFlat = flattenObj(mitigations);
        for (const [k, v] of Object.entries(mFlat)) {
          riskRows.push([humanize(k), formatCellValue(v)]);
        }
        riskRows.push([]);
      }
    } else {
      riskRows.push(['No risk data available.']);
    }
    const wsRisk = XLSX.utils.aoa_to_sheet(riskRows);
    autoFitColumns(wsRisk);
    XLSX.utils.book_append_sheet(wb, wsRisk, 'Risk Summary');

    // ── Sheet 4: Schedule ─────────────────────────────────────────────────
    if (schedule) {
      const ws = buildWorksheet(schedule, 'Schedule Overview', projectName);
      XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    }

    // ── Sheet 5: Stakeholders ─────────────────────────────────────────────
    if (stakeholder) {
      const ws = buildWorksheet(stakeholder, 'Stakeholder Summary', projectName);
      XLSX.utils.book_append_sheet(wb, ws, 'Stakeholders');
    }

    // ── Sheet 7: Expenses ─────────────────────────────────────────────────
    if (expenses) {
      const ws = buildWorksheet(expenses, 'Expense Summary', projectName);
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    }

    // Write file
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    saveAs(
      new Blob([buf], { type: 'application/octet-stream' }),
      `Project_Summary_${safeName}.xlsx`,
    );

    hide();
    message.success('Project summary exported successfully');
  } catch (err) {
    hide();
    console.error('Project summary export error:', err);
    message.error('Failed to generate project summary');
  }
};

const REPORT_DEFS: ReportDef[] = [
  {
    key: 'cost_overview',
    title: 'Cost Overview',
    description: 'Total budget, costs, expenses, and variance for the project.',
    icon: <DollarOutlined />,
    color: '#00ff88',
    fetch: (id) => costService.getCostOverview(id),
    sheetName: 'Cost Overview',
  },
  {
    key: 'evm',
    title: 'Earned Value Management (EVM)',
    description: 'SPI, CPI, Planned Value, Earned Value, and Actual Cost.',
    icon: <BarChartOutlined />,
    color: '#1890ff',
    fetch: (id) => costService.getEVM(id),
    sheetName: 'EVM',
  },
  {
    key: 'cost_forecast',
    title: 'Cost Forecast',
    description: 'EAC, ETC, VAC, and TCPI project cost forecast.',
    icon: <DollarOutlined />,
    color: '#fa8c16',
    fetch: (id) => costService.getCostForecast(id),
    sheetName: 'Cost Forecast',
  },
  {
    key: 'risk_report',
    title: 'Risk Report',
    description: 'Risk summary, severity distribution, and mitigation status.',
    icon: <ExclamationCircleOutlined />,
    color: '#ff4d4f',
    fetch: (id) => riskService.getRiskReport(id),
    sheetName: 'Risk Report',
  },
  {
    key: 'schedule_overview',
    title: 'Schedule Overview',
    description: 'Project schedule, task counts, critical path summary.',
    icon: <CalendarOutlined />,
    color: '#722ed1',
    fetch: (id) => scheduleService.getProjectSchedule(id),
    sheetName: 'Schedule',
  },
  {
    key: 'stakeholder_summary',
    title: 'Stakeholder Summary',
    description: 'Stakeholder count, engagement level, and influence breakdown.',
    icon: <UsergroupAddOutlined />,
    color: '#eb2f96',
    fetch: (id) => stakeholderService.getSummary(id),
    sheetName: 'Stakeholders',
  },
  {
    key: 'expense_summary',
    title: 'Expense Summary',
    description: 'All project expenses grouped by category and approval status.',
    icon: <DollarOutlined />,
    color: '#52c41a',
    fetch: (id) => costService.getExpenseSummary(id),
    sheetName: 'Expenses',
  },
];

// ── render data tables ────────────────────────────────────────────────────────
const renderData = (data: any) => {
  if (!data) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ color: '#555' }}>No data returned</Text>} />;

  // Flat key-value for primitive-heavy objects
  const scalarEntries = Object.entries(data).filter(([, v]) => typeof v !== 'object' || v === null);
  const nestedEntries = Object.entries(data).filter(([, v]) => v !== null && typeof v === 'object' && !Array.isArray(v));
  const arrayEntries  = Object.entries(data).filter(([, v]) => Array.isArray(v) && (v as any[]).length > 0);

  // Combine scalars with flattened nested objects for the stat cards
  const allScalarEntries: [string, any][] = [...scalarEntries];
  for (const [parentKey, obj] of nestedEntries) {
    const flat = flattenObj(obj as Record<string, any>);
    for (const [k, v] of Object.entries(flat)) {
      if (typeof v !== 'object' || v === null) {
        allScalarEntries.push([`${parentKey} › ${k}`, v]);
      }
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {allScalarEntries.length > 0 && (
        <Row gutter={[12, 12]}>
          {allScalarEntries.map(([k, v]) => (
            <Col xs={12} sm={8} md={6} key={k}>
              <Card style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }} bodyStyle={{ padding: '12px 14px' }}>
                <Statistic
                  title={<Text style={{ color: '#777', fontSize: 11 }}>{humanize(k)}</Text>}
                  value={String(formatCellValue(v))}
                  valueStyle={{ color: '#ffffff', fontSize: 15, fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {arrayEntries.map(([k, v]) => {
        const arr = v as any[];
        if (!arr.length || typeof arr[0] !== 'object') return null;
        const flatRows = arr.map(item => flattenObj(item));
        const allKeys = [...new Set(flatRows.flatMap(r => Object.keys(r)))];
        const visibleKeys = allKeys.filter(col => !['__v', 'isDeleted', 'deletedAt'].includes(col));
        const columns = visibleKeys.map(col => ({
          title: humanize(col),
          dataIndex: col,
          key: col,
          render: (val: any) => {
            const fv = formatCellValue(val);
            return typeof fv === 'number' ? fv.toLocaleString() : fv;
          },
        }));
        return (
          <div key={k}>
            <Text style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 8 }}>{humanize(k)}</Text>
            <Table
              rowKey={(_, i) => String(i)}
              dataSource={flatRows}
              columns={columns}
              pagination={arr.length > 10 ? { pageSize: 10 } : false}
              size="small"
              style={{ background: '#141414' }}
            />
          </div>
        );
      })}
    </Space>
  );
};

// ── main component ────────────────────────────────────────────────────────────
const Reports: React.FC = () => {
  const { selectedProject, setSelectedProject, projects, isLoading: projectsLoading } = useProject();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  // per-report state: { data, loading, error, generated }
  const [reportState, setReportState]   = useState<Record<string, { data: any; loading: boolean; generated: boolean; error?: string }>>({});

  // Reset report results when project changes
  useEffect(() => {
    setReportState({});
  }, [selectedProject]);

  const generateReport = async (def: ReportDef) => {
    if (!selectedProject?.id) { message.warning('Select a project first'); return; }
    setReportState(prev => ({ ...prev, [def.key]: { data: null, loading: true, generated: false } }));
    try {
      const data = await def.fetch(selectedProject.id);
      setReportState(prev => ({ ...prev, [def.key]: { data, loading: false, generated: true } }));
    } catch (err: any) {
      setReportState(prev => ({ ...prev, [def.key]: { data: null, loading: false, generated: true, error: err.message } }));
    }
  };

  const generateAll = async () => {
    if (!selectedProject?.id) { message.warning('Select a project first'); return; }
    for (const def of REPORT_DEFS) {
      generateReport(def);
    }
  };

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', background: 'transparent', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
            <FileTextOutlined style={{ color: GREEN, marginRight: 12 }} />
            Reports
          </Title>
          <Text type="secondary">Generate and export project management reports</Text>
        </Col>
        <Col>
          <Space>
            <Select
              placeholder="Select a project"
              style={{ width: 280 }}
              loading={projectsLoading}
              value={selectedProject?.id || undefined}
              onChange={v => setSelectedProject(projects.find(p => p.id === v) ?? null)}
              showSearch
              optionFilterProp="label"
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id} label={p.name}>{p.name}</Option>
              ))}
            </Select>
            {selectedProject && (
              <>
                <Button
                  icon={<DownloadOutlined />}
                  type="primary"
                  onClick={() => generateProjectSummaryExport(selectedProject)}
                  style={{ background: GREEN, borderColor: GREEN }}
                >
                  Project Summary
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={generateAll}
                  style={{ borderColor: 'rgba(0,153,68,0.5)', color: '#00ff88' }}
                >
                  Generate All
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => exportAllToXlsx(REPORT_DEFS, reportState, selectedProject.name, selectedProject.id)}
                  disabled={!Object.values(reportState).some(s => s.generated && !s.error && s.data)}
                  style={{ borderColor: 'rgba(0,153,68,0.4)', color: '#00ff88' }}
                >
                  Export All
                </Button>
              </>
            )}
          </Space>
        </Col>
      </Row>

      {selectedProject && (
        <Card
          style={{ ...cardStyle, marginBottom: 24 }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Space size={24}>
            <Space direction="vertical" size={0}>
              <Text style={{ color: '#aaa', fontSize: 12 }}>Project</Text>
              <Text strong style={{ color: '#fff', fontSize: 15 }}>{selectedProject.name}</Text>
            </Space>
            {selectedProject.status && (
              <Space direction="vertical" size={0}>
                <Text style={{ color: '#aaa', fontSize: 12 }}>Status</Text>
                <Tag color="green">{selectedProject.status}</Tag>
              </Space>
            )}
            {selectedProject.clientName && (
              <Space direction="vertical" size={0}>
                <Text style={{ color: '#aaa', fontSize: 12 }}>Client</Text>
                <Text style={{ color: '#ccc' }}>{selectedProject.clientName}</Text>
              </Space>
            )}
            {selectedProject.budget !== undefined && (
              <Space direction="vertical" size={0}>
                <Text style={{ color: '#aaa', fontSize: 12 }}>Budget</Text>
                <Text style={{ color: '#00ff88' }}>₱{Number(selectedProject.budget).toLocaleString('en-PH')}</Text>
              </Space>
            )}
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {REPORT_DEFS.map(def => {
          const state = reportState[def.key];
          const isLoading   = state?.loading ?? false;
          const isGenerated = state?.generated ?? false;
          const hasError    = !!state?.error;

          return (
            <Col xs={24} key={def.key}>
              <Card
                style={cardStyle}
                bodyStyle={{ padding: '0' }}
              >
                {/* Card header row */}
                <div style={{ padding: '20px 24px', borderBottom: isGenerated ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space size={12}>
                        <span style={{ color: def.color, fontSize: 22 }}>{def.icon}</span>
                        <Space direction="vertical" size={0}>
                          <Text strong style={{ color: '#ffffff', fontSize: 15 }}>{def.title}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{def.description}</Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col>
                      <Space>
                        {isGenerated && !hasError && state?.data && (
                          <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => exportToXlsx(state.data, def.sheetName, `${def.key}_${selectedProject?.id}`, selectedProject?.name ?? 'Project')}
                            style={{ borderColor: 'rgba(0,153,68,0.4)', color: '#00ff88' }}
                          >
                            Export XLSX
                          </Button>
                        )}
                        <Button
                          size="small"
                          type={isGenerated ? 'default' : 'primary'}
                          loading={isLoading}
                          disabled={!selectedProject?.id}
                          icon={<ReloadOutlined />}
                          onClick={() => generateReport(def)}
                          style={!isGenerated ? { background: GREEN, borderColor: GREEN } : {}}
                        >
                          {isGenerated ? 'Refresh' : 'Generate'}
                        </Button>
                      </Space>
                    </Col>
                  </Row>
                </div>

                {/* Report body */}
                {isLoading && (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <Spin size="default" />
                    <div style={{ color: '#666', marginTop: 8, fontSize: 12 }}>Fetching report data...</div>
                  </div>
                )}
                {isGenerated && !isLoading && (
                  <div style={{ padding: '20px 24px' }}>
                    {hasError ? (
                      <Text style={{ color: '#ff4d4f', fontSize: 13 }}>{state?.error}</Text>
                    ) : state?.data ? (
                      renderData(state.data)
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ color: '#555' }}>No data returned from API</Text>} />
                    )}
                  </div>
                )}

                {!isGenerated && !isLoading && (
                  <div style={{ padding: '12px 24px 20px', borderTop: 'none' }}>
                    <Text style={{ color: '#444', fontSize: 12 }}>
                      {selectedProject?.id ? 'Click "Generate" to fetch this report.' : 'Select a project above to enable report generation.'}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default Reports;
