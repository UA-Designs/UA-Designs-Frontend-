import React, { useState, useEffect } from 'react';
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { projectService, ProjectDashboardData } from '../../services/projectService';
import { costService, Budget, Expense } from '../../services/costService';
import { resourceService } from '../../services/resourceService';
import { Project } from '../../types';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [proj, dash, budgetsRes, expensesRes, allocsRes, overviewRes] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectDashboard(projectId).catch(() => null),
          costService.getBudgets().catch(() => []),
          costService.getExpensesPaginated({ projectId, limit: 5 }).catch(() => ({ expenses: [], pagination: { totalItems: 0, currentPage: 1, totalPages: 0, hasNext: false, hasPrev: false } })),
          resourceService.getAllocations(projectId).catch(() => []),
          costService.getCostOverview(projectId).catch(() => null),
        ]);
        if (!cancelled) {
          setProject(proj);
          setDashboardData(dash);
          const allBudgets = Array.isArray(budgetsRes) ? budgetsRes : [];
          setBudgets(allBudgets.filter((b: Budget) => b.projectId === projectId));
          setExpensesResult(expensesRes);
          setAllocations(Array.isArray(allocsRes) ? allocsRes : []);
          setCostOverview(overviewRes);
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

  const boqColumns: ColumnsType<Budget> = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="blue">{s || '—'}</Tag> },
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
        <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginTop: 16 }}>
          {budgets.length > 0 ? (
            <>
              <Table
                rowKey="id"
                dataSource={budgets}
                columns={boqColumns}
                pagination={false}
                size="small"
                style={{ background: 'transparent' }}
              />
              <Button type="link" icon={<RightOutlined />} onClick={goToCost} style={{ color: '#009944', marginTop: 8 }}>
                Open in Cost Management
              </Button>
            </>
          ) : (
            <>
              <Empty description="No BOQ / budgets for this project" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              <Button type="primary" onClick={goToCost} style={{ background: '#009944', borderColor: '#009944' }}>
                Add in Cost Management
              </Button>
            </>
          )}
        </Card>
      ),
    },
    {
      key: 'site',
      label: <>Site Usage <BarChartOutlined /></>,
      children: (
        <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginTop: 16 }}>
          {allocations.length > 0 ? (
            <>
              <Table
                rowKey="id"
                dataSource={allocations}
                columns={allocationColumns}
                pagination={false}
                size="small"
                style={{ background: 'transparent' }}
              />
              <Button type="link" icon={<RightOutlined />} onClick={goToResources} style={{ color: '#009944', marginTop: 8 }}>
                Open in Resources
              </Button>
            </>
          ) : (
            <>
              <Empty description="No usage records for this project" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              <Button type="primary" onClick={goToResources} style={{ background: '#009944', borderColor: '#009944' }}>
                Manage in Resources
              </Button>
            </>
          )}
        </Card>
      ),
    },
    {
      key: 'variance',
      label: <>Variance <LineChartOutlined /></>,
      children: (
        <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginTop: 16 }}>
          {costOverview ? (
            <Space direction="vertical" size={12}>
              <Text style={{ color: '#aaa' }}>Total Budget: <Text strong style={{ color: '#fff' }}>{formatCurrency(costOverview.totalBudget)}</Text></Text>
              <Text style={{ color: '#aaa' }}>Total Cost: <Text strong style={{ color: '#fff' }}>{formatCurrency(costOverview.totalCosts)}</Text></Text>
              <Text style={{ color: '#aaa' }}>Variance: <Text strong style={{ color: (costOverview.variance ?? 0) >= 0 ? '#00ff88' : '#ff4d4f' }}>{formatCurrency(costOverview.variance)}</Text></Text>
              <Button type="link" icon={<RightOutlined />} onClick={goToCost} style={{ color: '#009944', padding: 0 }}>
                Open in Cost Management
              </Button>
            </Space>
          ) : (
            <>
              <Empty description="No variance data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              <Button type="primary" onClick={goToCost} style={{ background: '#009944', borderColor: '#009944' }}>
                View in Cost Management
              </Button>
            </>
          )}
        </Card>
      ),
    },
    {
      key: 'expenses',
      label: <>Expenses <FundOutlined /></>,
      children: (
        <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginTop: 16 }}>
          {expensesResult.expenses?.length > 0 ? (
            <>
              <Table
                rowKey="id"
                dataSource={expensesResult.expenses}
                columns={expenseColumns}
                pagination={false}
                size="small"
                style={{ background: 'transparent' }}
              />
              {(expensesResult.pagination?.totalItems ?? 0) > 5 && (
                <Text style={{ color: '#aaa', display: 'block', marginTop: 8 }}>
                  Showing 5 of {expensesResult.pagination.totalItems} expenses
                </Text>
              )}
              <Button type="link" icon={<RightOutlined />} onClick={goToCost} style={{ color: '#009944', marginTop: 8 }}>
                View all in Cost Management
              </Button>
            </>
          ) : (
            <>
              <Empty description="No expenses for this project" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              <Button type="primary" onClick={goToCost} style={{ background: '#009944', borderColor: '#009944' }}>
                Add in Cost Management
              </Button>
            </>
          )}
        </Card>
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
              {project.location && (
                <Text style={{ color: '#bbb', fontSize: 13 }}>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  {project.location}
                </Text>
              )}
              {project.startDate && (
                <Text style={{ color: '#bbb', fontSize: 13 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  Started: {dayjs(project.startDate).format('M/D/YYYY')}
                </Text>
              )}
              {(project.endDate || project.plannedEndDate) && (
                <Text style={{ color: '#bbb', fontSize: 13 }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  Due: {dayjs(project.endDate || project.plannedEndDate).format('M/D/YYYY')}
                </Text>
              )}
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
