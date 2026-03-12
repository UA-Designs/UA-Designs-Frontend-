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
import { costService, Budget, Expense, Cost, CostType } from '../../services/costService';
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
    form.setFieldValue('materialId', undefined);
  }, [category, form]);

  useEffect(() => {
    if (!open || !projectId) return;
    form.resetFields();
    form.setFieldsValue({ category: CostType.MATERIAL, estimatedQty: 0, unitCost: 0 });
    setLoadingOptions(true);
    const load = async () => {
      // Use only project-scoped resources to avoid 400 when API requires projectId
      const [mProj, lProj, eProj] = await Promise.all([
        resourceService.getMaterials(projectId).catch(() => []),
        resourceService.getLabor(projectId).catch(() => []),
        resourceService.getEquipment(projectId).catch(() => []),
      ]);
      setMaterials(Array.isArray(mProj) ? mProj : []);
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
      const { category: cat, materialId, estimatedQty, unitCost, tradeCategory, notes } = values;
      const list = cat === CostType.MATERIAL ? materials : cat === CostType.LABOR ? labor : equipment;
      const item = list.find((x: { id: string }) => x.id === materialId);
      const name = item?.name ?? 'Unnamed item';
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
        <Form.Item
          name="materialId"
          label={<span style={labelStyle}>{category === CostType.MATERIAL ? 'Material' : category === CostType.LABOR ? 'Labor' : 'Equipment'} *</span>}
          rules={[{ required: true, message: `Select ${category === CostType.MATERIAL ? 'material' : category === CostType.LABOR ? 'labor' : 'equipment'}` }]}
        >
          <Select
            placeholder={category === CostType.MATERIAL ? 'Select material' : category === CostType.LABOR ? 'Select labor' : 'Select equipment'}
            loading={loadingOptions}
            style={{ width: '100%' }}
            dropdownStyle={{ background: '#1f1f1f' }}
            optionFilterProp="label"
            options={itemOptions.map(o => ({ label: o.name, value: o.id }))}
          />
        </Form.Item>
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
        const [proj, dash, budgetsRes, expensesRes, overviewRes, costsRes, breakdownRes] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectDashboard(projectId).catch(() => null),
          costService.getBudgets().catch(() => []),
          costService.getExpensesPaginated({ projectId, limit: 100 }).catch(() => ({ expenses: [], pagination: { totalItems: 0, currentPage: 1, totalPages: 0, hasNext: false, hasPrev: false } })),
          costService.getCostOverview(projectId).catch(() => null),
          costService.getCosts().catch(() => []),
          costService.getCostBreakdown(projectId).catch(() => null),
        ]);
        if (!cancelled) {
          setProject(proj);
          setDashboardData(dash);
          const allBudgets = Array.isArray(budgetsRes) ? budgetsRes : [];
          setBudgets(allBudgets.filter((b: Budget) => b.projectId === projectId));
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

  // All hooks must be called before any early return
  const boqByCategory = useMemo(() => {
    const breakdown = costBreakdown || {};
    const material = breakdown.materials ?? breakdown.Material ?? costs.filter(c => c.type === CostType.MATERIAL).reduce((s, c) => s + (c.amount ?? 0), 0);
    const labor = breakdown.labor ?? breakdown.Labor ?? costs.filter(c => c.type === CostType.LABOR).reduce((s, c) => s + (c.amount ?? 0), 0);
    const equipment = breakdown.equipment ?? breakdown.Equipment ?? costs.filter(c => c.type === CostType.EQUIPMENT).reduce((s, c) => s + (c.amount ?? 0), 0);
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

  if (loading || !project) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', minHeight: 400, alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const statusCfg = statusConfig[project.status] || { color: 'default', label: project.status };
  const budget = Number(project.budget ?? 0) || 0;
  const costsSum = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const expensesSum = (expensesResult.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const spent = Number((project as any).actualCost ?? costOverview?.totalCosts ?? 0) || costsSum || expensesSum;
  const remaining = Math.max(0, budget - spent);
  const pctUsed = budget ? Math.round((spent / budget) * 100) : 0;
  const teamMembers = (project as any).teamMembers ?? [];
  const projAny = project as any;
  const projectLocation = project.location ?? projAny.location ?? projAny.address ?? projAny.site_address ?? '';
  const projectStartDate = project.startDate ?? projAny.start_date ?? projAny.planned_start_date ?? '';
  const projectEndDate = project.endDate ?? project.plannedEndDate ?? projAny.end_date ?? projAny.planned_end_date ?? '';

  const boqCount = costs.length || dashboardData?.pmbokCoreAreas?.cost?.count ?? dashboardData?.budgetCount ?? budgets.length;
  const expenseCount = expensesResult.expenses?.length ?? (dashboardData as any)?.expenseCount ?? expensesResult.pagination?.totalItems ?? 0;
  const totalExpenseAmount = expensesSum;

  const goToCost = () => navigate('/pmbok/cost', { state: { projectId } });

  const totalBOQ = boqByCategory.material + boqByCategory.labor + boqByCategory.equipment || budgets.reduce((s, b) => s + (b.amount ?? 0), 0);
  const estimatedTotal = Number(costOverview?.totalBudget ?? 0) || budget || totalBOQ;
  const actualSpent = Number(costOverview?.totalCosts ?? 0) || spent;
  const varianceChartData = [
    { category: 'Materials', budget: boqByCategory.material, actual: costBreakdown?.actualMaterials ?? costs.filter(c => c.type === CostType.MATERIAL).reduce((s, c) => s + (c.amount ?? 0), 0) },
    { category: 'Labor', budget: boqByCategory.labor, actual: costBreakdown?.actualLabor ?? costs.filter(c => c.type === CostType.LABOR).reduce((s, c) => s + (c.amount ?? 0), 0) },
    { category: 'Equipment', budget: boqByCategory.equipment, actual: costBreakdown?.actualEquipment ?? costs.filter(c => c.type === CostType.EQUIPMENT).reduce((s, c) => s + (c.amount ?? 0), 0) },
  ];

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
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><InboxOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Material</Text></Space>
                <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 600, marginTop: 8 }}>{formatCurrency(boqByCategory.material)}</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><UserOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Labor</Text></Space>
                <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 600, marginTop: 8 }}>{formatCurrency(boqByCategory.labor)}</div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><ToolOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Equipment</Text></Space>
                <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 600, marginTop: 8 }}>{formatCurrency(boqByCategory.equipment)}</div>
              </Card>
            </Col>
          </Row>
          <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
            {costs.length > 0 ? (
              <Table rowKey="id" dataSource={filteredBoqCosts} columns={boqColumns} pagination={{ pageSize: 10 }} size="small" style={{ background: 'transparent' }} />
            ) : (
              <>
                <Empty description="No BOQ items yet. Add items below." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
                <Button type="primary" onClick={() => setAddBOQModalOpen(true)} style={{ background: '#009944', borderColor: '#009944', marginBottom: 16 }}>
                  Add Material
                </Button>
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
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Budget: {formatCurrency(boqByCategory.material)}</Text><br />
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Actual: {formatCurrency(costBreakdown?.actualMaterials ?? 0)}</Text><br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>0%</Text>
                  <Text style={{ color: '#00ff88', fontSize: 13, marginLeft: 8 }}>+{formatCurrency(boqByCategory.material)}</Text><br />
                  <Text style={{ color: '#aaa', fontSize: 11 }}>{boqByCategory.materialCount} items in BOQ</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><UserOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Labor</Text></Space>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Budget: {formatCurrency(boqByCategory.labor)}</Text><br />
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Actual: {formatCurrency(costBreakdown?.actualLabor ?? 0)}</Text><br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>0%</Text>
                  <Text style={{ color: '#00ff88', fontSize: 13, marginLeft: 8 }}>+{formatCurrency(boqByCategory.labor)}</Text><br />
                  <Text style={{ color: '#aaa', fontSize: 11 }}>{boqByCategory.laborCount} items in BOQ</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
                <Space><ToolOutlined style={{ color: '#009944' }} /><Text strong style={{ color: '#fff' }}>Equipment</Text></Space>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Budget: {formatCurrency(boqByCategory.equipment)}</Text><br />
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Actual: {formatCurrency(costBreakdown?.actualEquipment ?? 0)}</Text><br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>0%</Text>
                  <Text style={{ color: '#00ff88', fontSize: 13, marginLeft: 8 }}>+{formatCurrency(boqByCategory.equipment)}</Text><br />
                  <Text style={{ color: '#aaa', fontSize: 11 }}>{boqByCategory.equipmentCount} items in BOQ</Text>
                </div>
              </Card>
            </Col>
          </Row>
          <Card title="Budget vs Actual by Category" style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginBottom: 24 }}>
            <ChartErrorBoundary height={280}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={varianceChartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="category" tick={{ fill: '#bbb', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#bbb', fontSize: 11 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.3)' }} formatter={(v: number) => [formatCurrency(v), '']} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#009944" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#333" radius={[4, 4, 0, 0]} />
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
              <Table rowKey="id" dataSource={filteredVarianceCosts} columns={varianceTableColumns} pagination={{ pageSize: 5 }} size="small" style={{ background: 'transparent' }} />
            ) : (
              <Empty description="No variance items" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
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
