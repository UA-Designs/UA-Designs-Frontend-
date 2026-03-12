import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Tabs,
  Progress,
  Select,
  Spin,
  message,
  Space,
  Table,
  Empty,
  Input,
  Modal,
  Form,
  InputNumber,
  Segmented,
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  BankOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  RightOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  UserOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { projectService, ProjectDashboardData } from '../../services/projectService';
import { costService, Budget, Expense, Cost, CostType, ExpenseCategory } from '../../services/costService';
import { resourceService, Material, Labor, Equipment } from '../../services/resourceService';
import { Project } from '../../types';
import { ChartErrorBoundary } from '../../components/Charts/ChartErrorBoundary';

const { Text } = Typography;
const { Option } = Select;

const statusConfig: Record<string, { color: string; label: string }> = {
  planning:    { color: 'blue',    label: 'Planning' },
  active:      { color: 'green',   label: 'Active' },
  in_progress: { color: 'cyan',   label: 'In Progress' },
  on_hold:     { color: 'orange', label: 'On Hold' },
  completed:   { color: 'purple', label: 'Completed' },
  cancelled:   { color: 'red',    label: 'Cancelled' },
};

const formatCurrency = (v?: number) =>
  v !== undefined && v !== null ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

/** Show % used; use decimals or "<1%" when small so we don't show 0% for non-zero actual. */
const formatPctUsed = (actual: number, budget: number): string => {
  if (!budget) return actual ? '100' : '0';
  const pct = (actual / budget) * 100;
  if (pct === 0 && actual > 0) return '<1';
  if (pct > 0 && pct < 1) return pct.toFixed(1);
  return String(Math.round(pct));
};

const TRADE_CATEGORIES = [
  'Gen Requirements',
  'Earthworks',
  'Concrete Work',
  'RSB Works',
  'Masonry Works',
  'Plastering Works',
  'Roofing',
  'Ceiling Works',
  'Tiles Works',
  'Paint Works',
  'Doors & Windows',
  'Electrical Works',
  'Plumbing Works',
  'Formworks',
  'Labor',
  'Equipment',
  'Custom',
];

// ── Add BOQ Item Modal ─────────────────────────────────────────────────────
interface AddBOQModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}

const AddBOQModal: React.FC<AddBOQModalProps> = ({ open, projectId, onClose, onAdded }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [labor, setLabor] = useState<Labor[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const category = Form.useWatch('category', form) || CostType.MATERIAL;

  useEffect(() => {
    if (category === CostType.LABOR) {
      form.setFieldValue('materialId', undefined);
    } else {
      form.setFieldValue('laborName', undefined);
    }
  }, [category, form]);

  useEffect(() => {
    if (!open || !projectId) return;
    form.resetFields();
    form.setFieldsValue({ category: CostType.MATERIAL, estimatedQty: 0, unitCost: 0 });
    setLoadingOptions(true);
    const load = async () => {
      // Materials are global (from Materials page); labor/equipment stay project-scoped
      const [mList, lProj, eProj] = await Promise.all([
        resourceService.getMaterials().catch(() => []),
        resourceService.getLabor(projectId).catch(() => []),
        resourceService.getEquipment(projectId).catch(() => []),
      ]);
      setMaterials(Array.isArray(mList) ? mList : []);
      setLabor(Array.isArray(lProj) ? lProj : []);
      setEquipment(Array.isArray(eProj) ? eProj : []);
    };
    load().finally(() => setLoadingOptions(false));
  }, [open, projectId, form]);

  const itemOptions = useMemo(() => {
    if (category === CostType.MATERIAL) return materials.map(m => ({ id: m.id, name: m.name }));
    if (category === CostType.LABOR) return labor.map(l => ({ id: l.id, name: l.name }));
    return equipment.map(e => ({ id: e.id, name: e.name }));
  }, [category, materials, labor, equipment]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { category: cat, materialId, laborName, estimatedQty, unitCost, tradeCategory, notes } = values;
      const name =
        cat === CostType.LABOR
          ? (laborName || '').trim() || 'Labor'
          : (() => {
              const list = cat === CostType.MATERIAL ? materials : equipment;
              const item = list.find((x: { id: string }) => x.id === materialId);
              return item?.name ?? 'Unnamed item';
            })();
      const totalAmount = Number(estimatedQty) * Number(unitCost);
      setSaving(true);
      await costService.createCost({
        name,
        type: cat,
        amount: totalAmount,
        date: new Date().toISOString().split('T')[0],
        projectId,
        description: [tradeCategory, notes].filter(Boolean).join(' — ') || undefined,
      });
      message.success('BOQ item added');
      onAdded();
      onClose();
      form.resetFields();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.message || 'Failed to add BOQ item');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { color: '#d9d9d9' };
  const inputStyle = { background: '#2a2a2a', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' };

  return (
    <Modal
      title="Add BOQ Item"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Add to BOQ"
      okButtonProps={{ loading: saving, disabled: saving, style: { background: '#009944', borderColor: '#009944' } }}
      cancelButtonProps={{ disabled: saving }}
      width={520}
      destroyOnClose
      styles={{ content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' }, header: { background: '#1f1f1f' } }}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
        <Form.Item name="category" label={<span style={labelStyle}>Category *</span>} rules={[{ required: true }]}>
          <Segmented
            options={[
              { label: 'Material', value: CostType.MATERIAL },
              { label: 'Labor', value: CostType.LABOR },
              { label: 'Equipment', value: CostType.EQUIPMENT },
            ]}
            block
            style={{ background: '#2a2a2a' }}
          />
        </Form.Item>
        <Form.Item name="tradeCategory" label={<span style={labelStyle}>Trade Category (optional)</span>}>
          <Select
            placeholder="Select trade category (optional)"
            allowClear
            style={{ width: '100%' }}
            dropdownStyle={{ background: '#1f1f1f' }}
            optionFilterProp="label"
            options={TRADE_CATEGORIES.map(t => ({ label: t, value: t }))}
          />
        </Form.Item>
        {category === CostType.LABOR ? (
          <Form.Item
            name="laborName"
            label={<span style={labelStyle}>Labor *</span>}
            rules={[{ required: true, message: 'Enter labor description' }]}
          >
            <Input placeholder="e.g. Masonry labor, Electrical work" style={inputStyle} allowClear />
          </Form.Item>
        ) : (
          <Form.Item
            name="materialId"
            label={<span style={labelStyle}>{category === CostType.MATERIAL ? 'Material' : 'Equipment'} *</span>}
            rules={[{ required: true, message: `Select ${category === CostType.MATERIAL ? 'material' : 'equipment'}` }]}
          >
            <Select
              placeholder={category === CostType.MATERIAL ? 'Select material' : 'Select equipment'}
              loading={loadingOptions}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1f1f1f' }}
              optionFilterProp="label"
              options={itemOptions.map(o => ({ label: o.name, value: o.id }))}
            />
          </Form.Item>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="estimatedQty" label={<span style={labelStyle}>Estimated Qty *</span>} rules={[{ required: true }]} initialValue={0}>
              <InputNumber min={0} step={0.01} style={{ width: '100%', ...inputStyle }} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="unitCost" label={<span style={labelStyle}>Unit Cost *</span>} rules={[{ required: true }]} initialValue={0}>
              <InputNumber min={0} step={0.01} style={{ width: '100%', ...inputStyle }} placeholder="0.00" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label={<span style={labelStyle}>Notes</span>}>
          <Input.TextArea rows={2} placeholder="Optional notes..." style={{ ...inputStyle, resize: 'none' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expensesResult, setExpensesResult] = useState<{ expenses: Expense[]; pagination: { totalItems: number } }>({ expenses: [], pagination: { totalItems: 0 } });
  const [budgetOverview, setBudgetOverview] = useState<{
    budget: number;
    totalActualCost: number;
    variance: number;
    isOverBudget: boolean;
    expenseCount: number;
  } | null>(null);
  const [costOverview, setCostOverview] = useState<any>(null);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'material' | 'labor' | 'equipment'>('all');
  const [boqSearch, setBoqSearch] = useState('');
  const [varianceSearch, setVarianceSearch] = useState('');
  const [addBOQModalOpen, setAddBOQModalOpen] = useState(false);

  const refetchCosts = useCallback(async () => {
    if (!projectId) return;
    try {
      const list = await costService.getCosts();
      setCosts((list || []).filter((c: Cost) => c.projectId === projectId));
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [proj, budgetOv, dash, budgetsRes, expensesRes, overviewRes, costsRes, breakdownRes] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectBudgetOverview(projectId),
          projectService.getProjectDashboard(projectId).catch(() => null),
          costService.getBudgets(projectId).catch(() => []),
          costService.getExpensesPaginated({ projectId, limit: 100 }).catch(() => ({ expenses: [], pagination: { totalItems: 0, currentPage: 1, totalPages: 0, hasNext: false, hasPrev: false } })),
          costService.getCostOverview(projectId).catch(() => null),
          costService.getCosts().catch(() => []),
          costService.getCostBreakdown(projectId).catch(() => null),
        ]);
        if (!cancelled) {
          setProject(proj);
          setBudgetOverview(budgetOv);
          setDashboardData(dash);
          setBudgets(Array.isArray(budgetsRes) ? budgetsRes : []);
          setExpensesResult(expensesRes);
          setCostOverview(overviewRes);
          const allCosts = Array.isArray(costsRes) ? costsRes : [];
          setCosts(allCosts.filter((c: Cost) => c.projectId === projectId));
          setCostBreakdown(breakdownRes);
        }
      } catch (err: any) {
        if (!cancelled) message.error(err.message || 'Failed to load project');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  // Expense amounts by category (for actuals when no cost/BOQ items)
  const expensesByCategory = useMemo(() => {
    const list = expensesResult.expenses || [];
    const material = list.filter((e: Expense) => (e.category || '').toUpperCase() === 'MATERIAL').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const labor = list.filter((e: Expense) => (e.category || '').toUpperCase() === 'LABOR').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const equipment = list.filter((e: Expense) => (e.category || '').toUpperCase() === 'EQUIPMENT').reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const other = list.filter((e: Expense) => !['MATERIAL', 'LABOR', 'EQUIPMENT'].includes((e.category || '').toUpperCase())).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { material, labor, equipment, other };
  }, [expensesResult.expenses]);

  // All hooks must be called before any early return
  const boqByCategory = useMemo(() => {
    const breakdown = costBreakdown || {};
    // Some APIs return 0 for breakdown fields even when costs exist; only trust breakdown when > 0.
    const materialFromBreakdown = Number((breakdown as any).materials ?? (breakdown as any).Material ?? 0);
    const laborFromBreakdown = Number((breakdown as any).labor ?? (breakdown as any).Labor ?? 0);
    const equipmentFromBreakdown = Number((breakdown as any).equipment ?? (breakdown as any).Equipment ?? 0);

    const materialFromCosts = costs.filter(c => c.type === CostType.MATERIAL).reduce((s, c) => s + (c.amount ?? 0), 0);
    const laborFromCosts = costs.filter(c => c.type === CostType.LABOR).reduce((s, c) => s + (c.amount ?? 0), 0);
    const equipmentFromCosts = costs.filter(c => c.type === CostType.EQUIPMENT).reduce((s, c) => s + (c.amount ?? 0), 0);

    const material = materialFromBreakdown > 0 ? materialFromBreakdown : materialFromCosts;
    const labor = laborFromBreakdown > 0 ? laborFromBreakdown : laborFromCosts;
    const equipment = equipmentFromBreakdown > 0 ? equipmentFromBreakdown : equipmentFromCosts;
    const materialCount = costs.filter(c => c.type === CostType.MATERIAL).length;
    const laborCount = costs.filter(c => c.type === CostType.LABOR).length;
    const equipmentCount = costs.filter(c => c.type === CostType.EQUIPMENT).length;
    return {
      material: typeof material === 'number' ? material : 0,
      labor: typeof labor === 'number' ? labor : 0,
      equipment: typeof equipment === 'number' ? equipment : 0,
      materialCount: breakdown.materialCount ?? breakdown.materialsCount ?? materialCount,
      laborCount: breakdown.laborCount ?? breakdown.laborCount ?? laborCount,
      equipmentCount: breakdown.equipmentCount ?? equipmentCount,
    };
  }, [costs, costBreakdown]);

  const filteredBoqCosts = useMemo(() => {
    if (!boqSearch.trim()) return costs;
    const q = boqSearch.trim().toLowerCase();
    return costs.filter(c => (c.name || '').toLowerCase().includes(q) || (c.type || '').toLowerCase().includes(q));
  }, [costs, boqSearch]);

  const filteredVarianceCosts = useMemo(() => {
    let list = costs;
    if (varianceFilter === 'material') list = list.filter(c => c.type === CostType.MATERIAL);
    else if (varianceFilter === 'labor') list = list.filter(c => c.type === CostType.LABOR);
    else if (varianceFilter === 'equipment') list = list.filter(c => c.type === CostType.EQUIPMENT);
    if (varianceSearch.trim()) {
      const q = varianceSearch.trim().toLowerCase();
      list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.type || '').toLowerCase().includes(q));
    }
    return list;
  }, [costs, varianceFilter, varianceSearch]);

  const filteredVarianceExpenses = useMemo(() => {
    const list = expensesResult.expenses || [];
    if (varianceFilter === 'material') return list.filter((e: Expense) => (e.category || '').toUpperCase() === 'MATERIAL');
    if (varianceFilter === 'labor') return list.filter((e: Expense) => (e.category || '').toUpperCase() === 'LABOR');
    if (varianceFilter === 'equipment') return list.filter((e: Expense) => (e.category || '').toUpperCase() === 'EQUIPMENT');
    if (varianceSearch.trim()) {
      const q = varianceSearch.trim().toLowerCase();
      return list.filter((e: Expense) => (e.name || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    }
    return list;
  }, [expensesResult.expenses, varianceFilter, varianceSearch]);

  if (loading || !project) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', minHeight: 400, alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const statusCfg = statusConfig[project.status] || { color: 'default', label: project.status };
  const projAny = project as any;
  const teamMembers = projAny.teamMembers ?? [];
  const costsSum = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const expensesSum = (expensesResult.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const budgetsTotal = budgets.reduce((s, b) => s + (Number(b.amount) ?? 0), 0);
  // API: GET /projects/:id → data.project.budget (decimal string); GET /projects/:id/budget-overview → data.budget, data.totalActualCost
  const budget =
    (budgetOverview && Number(budgetOverview.budget) > 0 ? Number(budgetOverview.budget) : null) ??
    (project.budget != null && Number(project.budget) > 0 ? Number(project.budget) : null) ??
    (budgetsTotal > 0 ? budgetsTotal : 0);
  // Prefer backend totalActualCost when > 0; else use sum of fetched expenses so logged expenses show as spent
  const spent =
    Number(budgetOverview?.totalActualCost ?? 0) ||
    expensesSum ||
    Number(costOverview?.totalCosts ?? 0) ||
    costsSum ||
    0;
  const remaining = Math.max(0, budget - spent);
  const pctUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const projectLocation = project.location ?? projAny.location ?? projAny.address ?? projAny.site_address ?? '';
  const projectStartDate = project.startDate ?? projAny.start_date ?? projAny.planned_start_date ?? '';
  const projectEndDate = project.endDate ?? project.plannedEndDate ?? projAny.end_date ?? projAny.planned_end_date ?? '';

  const boqCount = costs.length || expensesResult.expenses?.length || (dashboardData?.pmbokCoreAreas?.cost?.count ?? dashboardData?.budgetCount ?? budgets.length);
  const expenseCount =
    budgetOverview?.expenseCount ??
    expensesResult.pagination?.totalItems ??
    expensesResult.expenses?.length ??
    (dashboardData as any)?.expenseCount ??
    0;
  const totalExpenseAmount = expensesSum;

  const goToCost = () => navigate('/pmbok/cost', { state: { projectId } });

  const totalBOQ = boqByCategory.material + boqByCategory.labor + boqByCategory.equipment || budgets.reduce((s, b) => s + (b.amount ?? 0), 0);
  const estimatedTotal = Number(costOverview?.totalBudget ?? 0) || budget || totalBOQ;
  const actualSpent = Number(costOverview?.totalCosts ?? 0) || spent;
  const actualByCat = {
    material: Number(costBreakdown?.actualMaterials ?? 0) || costs.filter(c => c.type === CostType.MATERIAL).reduce((s, c) => s + (c.amount ?? 0), 0) || expensesByCategory.material,
    labor: Number(costBreakdown?.actualLabor ?? 0) || costs.filter(c => c.type === CostType.LABOR).reduce((s, c) => s + (c.amount ?? 0), 0) || expensesByCategory.labor,
    equipment: Number(costBreakdown?.actualEquipment ?? 0) || costs.filter(c => c.type === CostType.EQUIPMENT).reduce((s, c) => s + (c.amount ?? 0), 0) || expensesByCategory.equipment,
  };
  // When BOQ/costs don't set category budget (0), use project budget for categories that have actual spend so chart and cards show budget vs actual
  const materialBudget = boqByCategory.material || (actualByCat.material > 0 && budget > 0 ? budget : 0);
  const laborBudget = boqByCategory.labor || (actualByCat.labor > 0 && budget > 0 ? budget : 0);
  const equipmentBudget = boqByCategory.equipment || (actualByCat.equipment > 0 && budget > 0 ? budget : 0);
  const varianceChartData = [
    { category: 'Materials', budget: materialBudget, actual: actualByCat.material },
    { category: 'Labor', budget: laborBudget, actual: actualByCat.labor },
    { category: 'Equipment', budget: equipmentBudget, actual: actualByCat.equipment },
  ];
  const chartMaxBudget = Math.max(...varianceChartData.map(d => d.budget), 1);
  const chartMaxActual = Math.max(...varianceChartData.map(d => d.actual), 1);

  const boqColumns: ColumnsType<Cost> = [
    { title: 'Item Name', dataIndex: 'name', key: 'name', render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text> },
    { title: 'Category', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t || '—'}</Tag> },
    { title: 'Trade', key: 'trade', render: () => <Tag style={{ background: 'rgba(255,255,255,0.1)' }}>—</Tag> },
    { title: 'Unit', key: 'unit', render: () => <Text style={{ color: '#bbb' }}>—</Text> },
    { title: 'Est. Qty', key: 'qty', render: () => <Text style={{ color: '#bbb' }}>1</Text> },
    { title: 'Unit Cost', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: '#fff' }}>{formatCurrency(v)}</Text> },
    { title: 'Total Amount', dataIndex: 'amount', key: 'total', render: (v: number) => <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text> },
    { title: 'Actions', key: 'actions', width: 80, render: (_, record) => (
      <Space>
        <Button type="text" icon={<EditOutlined />} style={{ color: '#009944' }} onClick={goToCost} />
        <Button type="text" icon={<DeleteOutlined />} danger onClick={goToCost} />
      </Space>
    ) },
  ];

  const varianceTableColumns: ColumnsType<Cost> = [
    { title: 'Item', dataIndex: 'name', key: 'name', render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text> },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t || '—'}</Tag> },
    { title: 'UM', key: 'um', render: () => <Text style={{ color: '#bbb' }}>—</Text> },
    { title: 'Cost', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: '#fff' }}>{formatCurrency(v)}</Text> },
    { title: 'Qty', key: 'qty', render: () => <Text style={{ color: '#bbb' }}>1</Text> },
    { title: 'ActualQty', key: 'actualQty', render: () => <Text style={{ color: '#bbb' }}>0</Text> },
    { title: 'Amount', dataIndex: 'amount', key: 'amt', render: (v: number) => <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text> },
    { title: 'ActualAmt', key: 'actualAmt', render: () => <Text style={{ color: '#bbb' }}>₱0</Text> },
    { title: 'Status', key: 'status', render: () => <Tag color="green">OK</Tag> },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => <Text style={{ color: '#bbb' }}>{d ? dayjs(d).format('M/D/YYYY') : '—'}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="green">{s || '—'}</Tag> },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card
              title="BOQ Items"
              style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 180 }}
              bodyStyle={{ padding: 24, textAlign: 'center', minHeight: 132 }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>{boqCount}</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#00ff88', fontSize: 14 }}>Total BOQ: {formatCurrency(totalBOQ || budget)}</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title="Total Expenses"
              style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 180 }}
              bodyStyle={{ padding: 24, textAlign: 'center', minHeight: 132 }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>{expenseCount}</Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#00ff88', fontSize: 14 }}>Total: {formatCurrency(totalExpenseAmount)}</Text>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'boq',
      label: <>BOQ <BankOutlined /></>,
      children: (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <Typography.Title level={4} style={{ color: '#ffffff', margin: 0 }}>Bill of Quantities</Typography.Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddBOQModalOpen(true)} style={{ background: '#009944', borderColor: '#009944' }}>
              Add Material
            </Button>
          </div>
          <Text style={{ display: 'block', color: '#00ff88', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Total Project Budget (BOQ): {formatCurrency(totalBOQ || budget)}
          </Text>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 92 }}
                bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 92 }}
              >
                <Space><InboxOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Material</Text></Space>
                <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 600, marginTop: 8 }}>{formatCurrency(boqByCategory.material)}</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 92 }}
                bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 92 }}
              >
                <Space><UserOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Labor</Text></Space>
                <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 600, marginTop: 8 }}>{formatCurrency(boqByCategory.labor)}</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 92 }}
                bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 92 }}
              >
                <Space><ToolOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Equipment</Text></Space>
                <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 600, marginTop: 8 }}>{formatCurrency(boqByCategory.equipment)}</div>
              </Card>
            </Col>
          </Row>
          <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
            {costs.length > 0 ? (
              <Table rowKey="id" dataSource={filteredBoqCosts} columns={boqColumns} pagination={{ pageSize: 10 }} size="small" style={{ background: 'transparent' }} />
            ) : expensesResult.expenses?.length > 0 ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', padding: '16px 24px 0' }}>No BOQ cost items yet. Showing expenses below.</Text>
                <Table rowKey="id" dataSource={expensesResult.expenses} columns={expenseColumns} pagination={{ pageSize: 10 }} size="small" style={{ background: 'transparent' }} />
                <Button type="primary" onClick={() => setAddBOQModalOpen(true)} style={{ background: '#009944', borderColor: '#009944', margin: 16 }}>Add BOQ Item</Button>
              </>
            ) : (
              <>
                <Empty description="No BOQ items yet. Add items below or log expenses in Expenses tab." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
                <Button type="primary" onClick={() => setAddBOQModalOpen(true)} style={{ background: '#009944', borderColor: '#009944', marginBottom: 16 }}>Add Material</Button>
              </>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'variance',
      label: <>Variance <LineChartOutlined /></>,
      children: (
        <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><InboxOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Materials</Text></Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>Budget: </Text><Text style={{ color: '#009944', fontSize: 13 }}>{formatCurrency(varianceChartData[0].budget)}</Text><br />
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>Actual: </Text><Text style={{ color: '#fff', fontSize: 13 }}>{formatCurrency(varianceChartData[0].actual)}</Text><br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>{formatPctUsed(varianceChartData[0].actual, varianceChartData[0].budget)}% used</Text>
                  <Text style={{ color: varianceChartData[0].actual > varianceChartData[0].budget ? '#ff4d4f' : '#52c41a', fontSize: 13, marginLeft: 8 }}>{varianceChartData[0].actual <= varianceChartData[0].budget ? '+' : ''}{formatCurrency(varianceChartData[0].budget - varianceChartData[0].actual)} variance</Text><br />
                  <Tag color={varianceChartData[0].actual > varianceChartData[0].budget ? 'red' : 'green'} style={{ marginTop: 4 }}>{varianceChartData[0].actual > varianceChartData[0].budget ? 'Over budget' : 'On track'}</Tag>
                  <Text style={{ color: '#aaa', fontSize: 11, display: 'block', marginTop: 4 }}>{boqByCategory.materialCount} items in BOQ</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><UserOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Labor</Text></Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>Budget: </Text><Text style={{ color: '#009944', fontSize: 13 }}>{formatCurrency(varianceChartData[1].budget)}</Text><br />
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>Actual: </Text><Text style={{ color: '#fff', fontSize: 13 }}>{formatCurrency(varianceChartData[1].actual)}</Text><br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>{formatPctUsed(varianceChartData[1].actual, varianceChartData[1].budget)}% used</Text>
                  <Text style={{ color: varianceChartData[1].actual > varianceChartData[1].budget ? '#ff4d4f' : '#52c41a', fontSize: 13, marginLeft: 8 }}>{varianceChartData[1].actual <= varianceChartData[1].budget ? '+' : ''}{formatCurrency(varianceChartData[1].budget - varianceChartData[1].actual)} variance</Text><br />
                  <Tag color={varianceChartData[1].actual > varianceChartData[1].budget ? 'red' : 'green'} style={{ marginTop: 4 }}>{varianceChartData[1].actual > varianceChartData[1].budget ? 'Over budget' : 'On track'}</Tag>
                  <Text style={{ color: '#aaa', fontSize: 11, display: 'block', marginTop: 4 }}>{boqByCategory.laborCount} items in BOQ</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><ToolOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Equipment</Text></Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>Budget: </Text><Text style={{ color: '#009944', fontSize: 13 }}>{formatCurrency(varianceChartData[2].budget)}</Text><br />
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>Actual: </Text><Text style={{ color: '#fff', fontSize: 13 }}>{formatCurrency(varianceChartData[2].actual)}</Text><br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>{formatPctUsed(varianceChartData[2].actual, varianceChartData[2].budget)}% used</Text>
                  <Text style={{ color: varianceChartData[2].actual > varianceChartData[2].budget ? '#ff4d4f' : '#52c41a', fontSize: 13, marginLeft: 8 }}>{varianceChartData[2].actual <= varianceChartData[2].budget ? '+' : ''}{formatCurrency(varianceChartData[2].budget - varianceChartData[2].actual)} variance</Text><br />
                  <Tag color={varianceChartData[2].actual > varianceChartData[2].budget ? 'red' : 'green'} style={{ marginTop: 4 }}>{varianceChartData[2].actual > varianceChartData[2].budget ? 'Over budget' : 'On track'}</Tag>
                  <Text style={{ color: '#aaa', fontSize: 11, display: 'block', marginTop: 4 }}>{boqByCategory.equipmentCount} items in BOQ</Text>
                </div>
              </Card>
            </Col>
          </Row>
          <Card title="Budget vs Actual by Category" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginBottom: 24 }}>
            <ChartErrorBoundary height={280}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={varianceChartData} margin={{ top: 16, right: 48, left: 48, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="category" tick={{ fill: '#bbb', fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" domain={[0, chartMaxBudget]} tick={{ fill: '#bbb', fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, chartMaxActual]} tick={{ fill: '#aaa', fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.3)' }} formatter={(v: number) => [formatCurrency(v), '']} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="budget" name="Budget" fill="#009944" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="actual" name="Actual" fill="#888" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </Card>
          <Card title="Detailed Variance Report" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}>
            <Space size="small" style={{ marginBottom: 16 }}>
              {(['all', 'material', 'labor', 'equipment'] as const).map((k) => (
                <Button key={k} type={varianceFilter === k ? 'primary' : 'default'} size="small" onClick={() => setVarianceFilter(k)} style={varianceFilter === k ? { background: '#009944', borderColor: '#009944' } : {}}>
                  {k === 'all' ? 'All' : k === 'material' ? 'Materials' : k === 'labor' ? 'Labor' : 'Equipment'}
                </Button>
              ))}
            </Space>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Project Budget</Text><div style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(budget)}</div></Card></Col>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Estimated (BOQ)</Text><div style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(estimatedTotal)}</div></Card></Col>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Actual Spent</Text><div style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(actualSpent)}</div></Card></Col>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Remaining</Text><div style={{ color: '#00ff88', fontWeight: 600 }}>{formatCurrency(Math.max(0, estimatedTotal - actualSpent))}</div></Card></Col>
            </Row>
            <Input placeholder="Search items..." value={varianceSearch} onChange={e => setVarianceSearch(e.target.value)} style={{ marginBottom: 12, background: '#141414', color: '#fff' }} allowClear />
            {filteredVarianceCosts.length > 0 ? (
              <>
                <Text style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>BOQ items (budget). Item-level actuals may be 0 until linked to expenses.</Text>
                <Table rowKey="id" dataSource={filteredVarianceCosts} columns={varianceTableColumns} pagination={{ pageSize: 5 }} size="small" style={{ background: 'transparent' }} />
                {(expensesResult.expenses?.length ?? 0) > 0 && (
                  <>
                    <Text strong style={{ color: '#fff', display: 'block', marginTop: 24, marginBottom: 8 }}>Actual spend (from logged expenses)</Text>
                    <Text style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>These logged expenses make up the &quot;Actual Spent&quot; total above. Sum of listed expenses below.</Text>
                    {(() => {
                      const varianceReportExpenses = varianceFilter === 'all' ? (expensesResult.expenses || []) : filteredVarianceExpenses;
                      const varianceReportExpensesSum = varianceReportExpenses.reduce((s, e) => s + (Number((e as Expense).amount) || 0), 0);
                      return (
                        <Table
                          rowKey="id"
                          dataSource={varianceReportExpenses}
                          columns={expenseColumns}
                          pagination={{ pageSize: 5 }}
                          size="small"
                          style={{ background: 'transparent' }}
                          summary={() => (
                            <Table.Summary fixed>
                              <Table.Summary.Row>
                                <Table.Summary.Cell index={0}><Text strong style={{ color: '#fff' }}>Total (listed)</Text></Table.Summary.Cell>
                                <Table.Summary.Cell index={1}><Text strong style={{ color: '#00ff88' }}>{formatCurrency(varianceReportExpensesSum)}</Text></Table.Summary.Cell>
                                <Table.Summary.Cell index={2} colSpan={2} />
                              </Table.Summary.Row>
                            </Table.Summary>
                          )}
                        />
                      );
                    })()}
                  </>
                )}
              </>
            ) : filteredVarianceExpenses.length > 0 ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 12 }}>Showing expenses (no BOQ cost items yet).</Text>
                <Table rowKey="id" dataSource={filteredVarianceExpenses} columns={expenseColumns} pagination={{ pageSize: 5 }} size="small" style={{ background: 'transparent' }} />
              </>
            ) : (
              <Empty description="No variance items. Log expenses in the Expenses tab." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'expenses',
      label: <>Expenses <FundOutlined /></>,
      children: (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <Typography.Title level={4} style={{ color: '#ffffff', margin: 0 }}>Project Expenses</Typography.Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={goToCost} style={{ background: '#009944', borderColor: '#009944' }}>
              Log Expense
            </Button>
          </div>
          <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}>
            {expensesResult.expenses?.length > 0 ? (
              <>
                <Table rowKey="id" dataSource={expensesResult.expenses} columns={expenseColumns} pagination={false} size="small" style={{ background: 'transparent' }} />
                {(expensesResult.pagination?.totalItems ?? 0) > (expensesResult.expenses?.length ?? 0) && (
                  <Text style={{ color: '#aaa', display: 'block', marginTop: 8 }}>Showing {expensesResult.expenses?.length ?? 0} of {expensesResult.pagination?.totalItems ?? 0} expenses</Text>
                )}
                <Button type="link" icon={<RightOutlined />} onClick={goToCost} style={{ color: '#009944', marginTop: 8 }}>View all in Cost Management</Button>
              </>
            ) : (
              <Empty description="No expenses found" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 48 }}>
                <Button type="primary" onClick={goToCost} style={{ background: '#009944', borderColor: '#009944' }}>Log Expense</Button>
              </Empty>
            )}
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: 'transparent', minHeight: '100vh' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/projects')}
        style={{ color: '#009944', marginBottom: 16, padding: 0 }}
      >
        Back to Projects
      </Button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <Typography.Title level={2} style={{ color: '#ffffff', margin: 0 }}>
            {project.name}
          </Typography.Title>
          <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
        </div>
        {project.clientName && (
          <Text style={{ color: '#aaa', fontSize: 14 }}>{project.clientName}</Text>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card
            title="Project Details"
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 220 }}
            bodyStyle={{ padding: 20, minHeight: 168 }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {projectLocation || '—'}
              </Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Started: {projectStartDate ? dayjs(projectStartDate).format('M/D/YYYY') : '—'}
              </Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Due: {projectEndDate ? dayjs(projectEndDate).format('M/D/YYYY') : '—'}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="Budget Overview"
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 220 }}
            bodyStyle={{ padding: 20, minHeight: 168 }}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 600 }}>{formatCurrency(budget)}</Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>Spent: {formatCurrency(spent)}</Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>Committed (BOQ): {formatCurrency(totalBOQ || budget)}</Text>
              <Text style={{ color: '#00ff88', fontSize: 15, fontWeight: 600 }}>Remaining: {formatCurrency(remaining)}</Text>
              <Progress percent={pctUsed} strokeColor="#009944" showInfo={false} size="small" />
              <Text style={{ color: '#00ff88', fontSize: 12 }}>{pctUsed}% used</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                Team Members
                <TeamOutlined />
              </span>
            }
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, minHeight: 220 }}
            bodyStyle={{ padding: 20, minHeight: 168 }}
          >
            {teamMembers.length === 0 ? (
              <Text style={{ color: '#aaa', fontSize: 13 }}>No team members assigned</Text>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 20, color: '#bbb' }}>
                {teamMembers.map((m: any) => (
                  <li key={m.id}>{(m.user?.firstName ?? '') + ' ' + (m.user?.lastName ?? '')}</li>
                ))}
              </ul>
            )}
            <Select
              placeholder="Add team member..."
              allowClear
              style={{ width: '100%', marginTop: 12 }}
              suffixIcon={null}
              dropdownStyle={{ background: '#1f1f1f' }}
            >
              <Option value="" disabled>Add team member...</Option>
            </Select>
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        style={{ color: '#fff' }}
      />

      <AddBOQModal
        open={addBOQModalOpen}
        projectId={projectId!}
        onClose={() => setAddBOQModalOpen(false)}
        onAdded={refetchCosts}
      />
    </div>
  );
};

export default ProjectDetail;
