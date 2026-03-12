import React, { useState, useEffect, useMemo } from 'react';
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
import { resourceService } from '../../services/resourceService';
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

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expensesResult, setExpensesResult] = useState<{ expenses: Expense[]; pagination: { totalItems: number } }>({ expenses: [], pagination: { totalItems: 0 } });
  const [allocations, setAllocations] = useState<any[]>([]);
  const [costOverview, setCostOverview] = useState<any>(null);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'material' | 'labor' | 'equipment'>('all');
  const [boqSearch, setBoqSearch] = useState('');
  const [varianceSearch, setVarianceSearch] = useState('');

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [proj, dash, budgetsRes, expensesRes, allocsRes, overviewRes, costsRes, breakdownRes] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectDashboard(projectId).catch(() => null),
          costService.getBudgets().catch(() => []),
          costService.getExpensesPaginated({ projectId, limit: 5 }).catch(() => ({ expenses: [], pagination: { totalItems: 0, currentPage: 1, totalPages: 0, hasNext: false, hasPrev: false } })),
          resourceService.getAllocations(projectId).catch(() => []),
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
          setAllocations(Array.isArray(allocsRes) ? allocsRes : []);
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
  const budget = project.budget ?? 0;
  const spent = (project as any).actualCost ?? costOverview?.totalCosts ?? 0;
  const remaining = Math.max(0, budget - spent);
  const pctUsed = budget ? Math.round((spent / budget) * 100) : 0;
  const teamMembers = (project as any).teamMembers ?? [];

  const boqCount = dashboardData?.pmbokCoreAreas?.cost?.count ?? dashboardData?.budgetCount ?? budgets.length;
  const usageCount = (dashboardData as any)?.usageRecordsCount ?? allocations.length;
  const expenseCount = (dashboardData as any)?.expenseCount ?? expensesResult.pagination?.totalItems ?? 0;

  const goToCost = () => navigate('/pmbok/cost', { state: { projectId } });
  const goToResources = () => navigate('/pmbok/resources', { state: { projectId } });

  const totalBOQ = boqByCategory.material + boqByCategory.labor + boqByCategory.equipment || budgets.reduce((s, b) => s + (b.amount ?? 0), 0);
  const estimatedTotal = costOverview?.totalBudget ?? totalBOQ ?? budget;
  const actualSpent = costOverview?.totalCosts ?? spent;
  const varianceChartData = [
    { category: 'Materials', budget: boqByCategory.material, actual: costBreakdown?.actualMaterials ?? 0 },
    { category: 'Labor', budget: boqByCategory.labor, actual: costBreakdown?.actualLabor ?? 0 },
    { category: 'Equipment', budget: boqByCategory.equipment, actual: costBreakdown?.actualEquipment ?? 0 },
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

  const allocationColumns: ColumnsType<any> = [
    { title: 'Resource', key: 'resource', render: (_, r) => <Text style={{ color: '#fff' }}>{(r.resourceName || r.resourceId || r.id) || '—'}</Text> },
    { title: 'Type', dataIndex: 'resourceType', key: 'resourceType', render: (t: string) => <Text style={{ color: '#bbb' }}>{t || '—'}</Text> },
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
          <Col xs={24} md={8}>
            <Card
              title="BOQ Items"
              style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
              bodyStyle={{ padding: 24, textAlign: 'center' }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>{boqCount}</Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              title="Usage Records"
              style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
              bodyStyle={{ padding: 24, textAlign: 'center' }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>{usageCount}</Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              title="Total Expenses"
              style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
              bodyStyle={{ padding: 24, textAlign: 'center' }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>{expenseCount}</Text>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={goToCost} style={{ background: '#009944', borderColor: '#009944' }}>
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
                <Empty description="No BOQ items yet. Add in Cost Management." image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
                <Button type="primary" onClick={goToCost} style={{ background: '#009944', borderColor: '#009944', marginBottom: 16 }}>
                  Add in Cost Management
                </Button>
              </>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'site',
      label: <>Site Usage <BarChartOutlined /></>,
      children: (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <Typography.Title level={4} style={{ color: '#ffffff', margin: 0 }}>Site Material Usage</Typography.Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={goToResources} style={{ background: '#009944', borderColor: '#009944' }}>
              Log Usage
            </Button>
          </div>
          <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}>
            {allocations.length > 0 ? (
              <>
                <Table rowKey="id" dataSource={allocations} columns={allocationColumns} pagination={false} size="small" style={{ background: 'transparent' }} />
                <Button type="link" icon={<RightOutlined />} onClick={goToResources} style={{ color: '#009944', marginTop: 8 }}>Open in Resources</Button>
              </>
            ) : (
              <Empty
                description="No material usage logged yet. Log daily consumption to track variance."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 48 }}
              >
                <Button type="primary" onClick={goToResources} style={{ background: '#009944', borderColor: '#009944' }}>Log Usage</Button>
              </Empty>
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
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Estimated Total</Text><div style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(estimatedTotal)}</div></Card></Col>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Actual Spent</Text><div style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(actualSpent)}</div></Card></Col>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Remaining</Text><div style={{ color: '#00ff88', fontWeight: 600 }}>{formatCurrency(Math.max(0, estimatedTotal - actualSpent))}</div></Card></Col>
              <Col xs={12} md={6}><Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}><Text style={{ color: '#aaa', fontSize: 12 }}>Wastage Items</Text><div style={{ color: '#00ff88', fontWeight: 600 }}>0</div></Card></Col>
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
                {(expensesResult.pagination?.totalItems ?? 0) > 5 && (
                  <Text style={{ color: '#aaa', display: 'block', marginTop: 8 }}>Showing 5 of {expensesResult.pagination.totalItems} expenses</Text>
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
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {project.location || '—'}
              </Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Started: {project.startDate ? dayjs(project.startDate).format('M/D/YYYY') : '—'}
              </Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Due: {project.endDate || project.plannedEndDate ? dayjs(project.endDate || project.plannedEndDate).format('M/D/YYYY') : '—'}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="Budget Overview"
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 20 }}
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
            style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
            bodyStyle={{ padding: 20 }}
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
    </div>
  );
};

export default ProjectDetail;
