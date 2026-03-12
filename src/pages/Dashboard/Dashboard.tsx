import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  Alert,
  Grid,
  Button,
  Typography,
  Progress,
  Tag,
} from 'antd';
import {
  DollarOutlined,
  LineChartOutlined,
  FolderOutlined,
  WarningOutlined,
  PlusOutlined,
  EyeOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { projectService } from '../../services/projectService';
import type { DashboardStats } from '../../types';

const { useBreakpoint } = Grid;
const { Text } = Typography;

const BOQ_CATEGORIES = [
  {
    key: 'materials',
    label: 'Materials',
    icon: '📦',
    iconColor: '#69b1ff',
    spent: 653062.77,
    budget: 7253424.95,
    status: 'On Track',
    statusColor: 'green',
    variance: 'Under by ₱6,600,362.18',
  },
  {
    key: 'labor',
    label: 'Labor',
    icon: '👷',
    iconColor: '#fadb14',
    spent: 0,
    budget: 2335215,
    status: 'On Track',
    statusColor: 'green',
    variance: 'Under by ₱2,335,215',
  },
  {
    key: 'equipment',
    label: 'Equipment',
    icon: '🔧',
    iconColor: '#9254de',
    spent: 37264,
    budget: 193057.85,
    status: 'On Track',
    statusColor: 'green',
    variance: 'Under by ₱155,793.85',
  },
  {
    key: 'fuel',
    label: 'Fuel',
    icon: '⛽',
    iconColor: '#52c41a',
    spent: 0,
    budget: 11000,
    status: 'On Track',
    statusColor: 'green',
    variance: 'Under by ₱11,000',
  },
];

const TRADE_ALERTS = [
  { name: 'RSB Works', status: 'over budget', statusTag: '1 over budget', color: '#ff4d4f', spent: 314005, budget: 1150250.25, icon: '🎯' },
  { name: 'Formworks', status: 'over budget', statusTag: '1 over budget', color: '#ff4d4f', spent: 68280, budget: 345074.95, icon: '🔨' },
  { name: 'Gen Requirements', status: 'near limit', statusTag: '1 near limit', color: '#faad14', spent: 151377.77, budget: 290295.9, icon: '📋' },
  { name: 'Earthworks', status: 'near limit', statusTag: '1 near limit', color: '#faad14', spent: 37264, budget: 294484, icon: '⛰️' },
  { name: 'Concrete Work', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 70800, budget: 654322.47, icon: '🧱' },
  { name: 'Roofing', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 0, budget: 620803.98, icon: '🏠' },
  { name: 'Masonry Works', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 48600, budget: 490416.65, icon: '🧱' },
  { name: 'Plastering Works', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 0, budget: 293490.5, icon: '🛠️' },
  { name: 'Ceiling Works', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 0, budget: 542579.85, icon: '⬜' },
  { name: 'Tiles Works', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 0, budget: 1284521.2, icon: '🔲' },
  { name: 'Paint Works', status: 'on track', statusTag: 'On track', color: '#52c41a', spent: 0, budget: 936877.28, icon: '🎨' },
];

const CRITICAL_ALERTS = [
  { project: 'A Proposed 2 Storey Residential Building', type: 'Material', item: 'PHENOLIC BOARD # 1/2MM (FORMWORKS)', detail: 'Spent P68,280 of P47,742.5 (Over by P20,537.5)', percent: 143, status: 'OVER', barColor: '#ff4d4f' },
  { project: 'A Proposed 2 Storey Residential Building', type: 'Material', item: 'DSB # 10MM (RSB)', usage: 'Used 900/934 pc', detail: 'Spent P133,800 of P130,760 (Over by P3,040)', percent: 102, status: 'OVER', barColor: '#ff4d4f' },
  { project: 'A Proposed 2 Storey Residential Building', type: 'Material', item: 'GENERAL REQUIREMENTS', usage: 'Used 274.25/274.25 sq_m', detail: 'Spent P151,377.77 of P151,377.77', percent: 100, barColor: '#faad14' },
  { project: 'A Proposed 2 Storey Residential Building', type: 'Equipment', item: 'Backhoe (Earthworks)', usage: 'Used 3/3 Days', percent: 100, barColor: '#faad14' },
];

const BUDGET_CHART_DATA = [
  { name: 'A Proposed 2 St...', budget: 5800000, materials: 653062.77, labor: 0, equipment: 37264, other: 0 },
  { name: 'A Proposed Reno...', budget: 3500000, materials: 0, labor: 0, equipment: 0, other: 0 },
];

const formatPeso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatPesoK = (v: number) => (v >= 1_000_000 ? `P${(v / 1_000_000).toFixed(0)}M` : `P${(v / 1_000).toFixed(0)}K`);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectStats, setProjectStats] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [statsData, projectStatsData, projectsResp] = await Promise.all([
          dashboardService.getStats().catch(() => null),
          projectService.getProjectStats().catch(() => null),
          projectService.getProjectsFiltered().catch(() => ({ projects: [], pagination: { total: 0 } })),
        ]);
        if (statsData) setStats(statsData);
        if (projectStatsData) setProjectStats(projectStatsData);
        setProjects((projectsResp as any).projects || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', background: 'transparent', minHeight: '100vh' }}>
        <Spin size="large" style={{ color: '#009944' }} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  const chartData =
    projects.length > 0
      ? projects.map((p) => {
          const name = p.name || p.projectName || 'Project';
          const short =
            name.length > 18 ? `${name.slice(0, 15)}...` : name;
          const budget = Number(p.budget ?? 0);
          const spent = Number((p as any).actualCost ?? 0);
          return {
            name: short,
            budget,
            actual: spent,
          };
        })
      : [];

  const projectsDisplay =
    projects.length > 0
      ? projects.map((p) => {
          const spent = Number((p as any).actualCost ?? 0);
          const budget = Number(p.budget ?? 0);
          const remaining = Math.max(0, budget - spent);
          const pctUsedRaw = budget > 0 ? (spent / budget) * 100 : 0;
          const pctUsedLabel =
            budget > 0
              ? pctUsedRaw === 0 && spent > 0
                ? '<1'
                : pctUsedRaw > 0 && pctUsedRaw < 1
                ? pctUsedRaw.toFixed(1)
                : String(Math.round(pctUsedRaw))
              : '0';
          const pctUsedProgress =
            budget > 0
              ? Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round(pctUsedRaw === 0 && spent > 0 ? 1 : pctUsedRaw)
                  )
                )
              : 0;
          const assignedCount = (p as any).teamMembers?.length ?? 0;
          return {
            name: p.name || p.projectName || 'Unnamed Project',
            status: p.status || 'Active',
            assigned: assignedCount,
            budget,
            remaining,
            percentUsedLabel: pctUsedLabel,
            percentUsedProgress: pctUsedProgress,
          };
        })
      : [];

  const cardStyle = {
    background: 'rgba(26, 26, 26, 0.95)',
    border: '1px solid rgba(0, 153, 68, 0.2)',
    borderRadius: 12,
  };

  return (
    <div
      style={{
        padding: isMobile ? 16 : 24,
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 204, 102, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 204, 102, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
        `,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0, color: '#ffffff', fontWeight: 700 }}>
            Dashboard
          </Typography.Title>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
            Overview of all projects and expenses
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/pmbok/cost')}
          style={{
            background: '#009944',
            borderColor: '#009944',
            height: 40,
            fontWeight: 600,
          }}
        >
          Log Expense
        </Button>
      </div>

      const totalBudget = projectStats?.totalBudget ?? stats?.totalBudget ?? 0;
      const totalSpent =
        projectStats?.spentBudget ?? stats?.actualCost ?? 0;
      const activeProjects =
        projectStats?.activeProjects ?? stats?.activeProjects ?? 0;
      const overBudgetCount = projects.filter((p) => {
        const b = Number(p.budget ?? 0);
        const s = Number((p as any).actualCost ?? 0);
        return b > 0 && s > b;
      }).length;

      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Budget</Text>}
              value={totalBudget}
              prefix={<DollarOutlined style={{ color: '#009944', marginRight: 8 }} />}
              formatter={(val) => formatPeso(Number(val))}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#009944' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Total Spent</Text>}
              value={totalSpent}
              prefix={<LineChartOutlined style={{ color: '#009944', marginRight: 8 }} />}
              formatter={(val) => formatPeso(Number(val))}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={cardStyle}>
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Active Projects</Text>}
              value={activeProjects}
              prefix={<FolderOutlined style={{ color: '#009944', marginRight: 8 }} />}
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            size="small"
            style={{
              ...cardStyle,
              background:
                overBudgetCount === 0
                  ? 'rgba(0, 153, 68, 0.12)'
                  : cardStyle.background,
              border:
                overBudgetCount === 0
                  ? '1px solid rgba(0, 153, 68, 0.4)'
                  : cardStyle.border,
            }}
          >
            <Statistic
              title={<Text style={{ color: 'rgba(255,255,255,0.65)' }}>Budget Alerts</Text>}
              value={overBudgetCount}
              prefix={
                <WarningOutlined
                  style={{
                    color: overBudgetCount === 0 ? '#52c41a' : '#faad14',
                    marginRight: 8,
                  }}
                />
              }
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}
            />
            {overBudgetCount === 0 && (
              <Text style={{ fontSize: 12, color: '#52c41a', marginTop: 4, display: 'block' }}>
                All projects within budget
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* BOQ Category Budget Status */}
      <Card
        title={<span style={{ fontWeight: 600, color: '#ffffff' }}>BOQ Category Budget Status</span>}
        style={{ marginBottom: 24, ...cardStyle }}
      >
        {BOQ_CATEGORIES.map((cat) => {
          const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
          return (
            <div
              key={cat.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `${cat.iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text strong style={{ color: '#fff' }}>{cat.label}</Text>
                  <Tag color={cat.statusColor}>{cat.status}</Tag>
                </div>
                <Progress percent={Math.min(100, Math.round(pct * 10) / 10)} showInfo={false} strokeColor="#009944" size="small" />
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                  {pct.toFixed(1)}% of budget used · {formatPeso(cat.spent)} / {formatPeso(cat.budget)}
                </Text>
                <Text style={{ fontSize: 12, color: '#52c41a', display: 'block', marginTop: 2 }}>{cat.variance}</Text>
              </div>
            </div>
          );
        })}
      </Card>

      <Row gutter={[24, 24]}>
        {/* Trade Category Alerts */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span style={{ fontWeight: 600, color: '#ffffff' }}>Trade Category Alerts</span>
                <Tag color="red">4 need attention</Tag>
              </span>
            }
            style={{ marginBottom: 24, height: '100%', ...cardStyle }}
          >
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {TRADE_ALERTS.map((t) => {
                const pct = t.budget > 0 ? Math.min(100, (t.spent / t.budget) * 100) : 0;
                return (
                  <div
                    key={t.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {t.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ color: '#fff' }}>{t.name}</Text>
                        <Tag color={t.status === 'over budget' ? 'red' : t.status === 'near limit' ? 'orange' : 'green'}>
                          {t.statusTag}
                        </Tag>
                      </div>
                      <Progress percent={Math.round(pct)} showInfo={false} strokeColor={t.color} size="small" style={{ marginTop: 4 }} />
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                        P{Number(t.spent).toLocaleString()} / P{Number(t.budget).toLocaleString()}
                      </Text>
                    </div>
                    <DownOutlined style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Critical Budget Alerts + Budget vs Actual */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <WarningOutlined />
                Critical Budget Alerts (4)
              </span>
            }
            style={{ marginBottom: 24, ...cardStyle }}
          >
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {CRITICAL_ALERTS.map((a, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderBottom: i < CRITICAL_ALERTS.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  }}
                >
                  {a.project && (
                    <Text style={{ fontSize: 12, display: 'block', marginBottom: 4, color: 'rgba(255,255,255,0.65)' }}>{a.project}</Text>
                  )}
                  <Text strong style={{ fontSize: 13, color: '#fff' }}>
                    {a.type}: {a.item}
                  </Text>
                  {a.usage && <Text style={{ fontSize: 12, display: 'block', color: 'rgba(255,255,255,0.65)' }}>{a.usage}</Text>}
                  {a.detail && <Text style={{ fontSize: 12, display: 'block', color: 'rgba(255,255,255,0.65)' }}>{a.detail}</Text>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <Progress percent={a.percent} showInfo={false} strokeColor={a.barColor} size="small" style={{ flex: 1 }} />
                    {a.status && <Tag color="red">{a.status}</Tag>}
                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{a.percent}%</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={<span style={{ fontWeight: 600, color: '#ffffff' }}>Budget vs Actual by Project</span>}
            style={cardStyle}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barGap={8} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11 }} tickFormatter={formatPesoK} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => formatPeso(val)}
                  labelFormatter={(label) => label}
                  contentStyle={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.3)', borderRadius: 8, color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar dataKey="budget" name="Budget" fill="#555" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#009944" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* All Projects */}
      <Card title={<span style={{ fontWeight: 600, color: '#ffffff' }}>All Projects</span>} style={{ marginTop: 24, ...cardStyle }}>
        <Row gutter={[16, 16]}>
          {projectsDisplay.map((p, i) => (
            <Col xs={24} md={12} key={i}>
              <Card
                size="small"
                style={cardStyle}
                actions={[
                  <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => navigate('/projects')} style={{ color: '#009944' }}>
                    View Details
                  </Button>,
                ]}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 15, color: '#fff' }}>{p.name}</Text>
                  <Tag color="green">{p.status}</Tag>
                </div>
                <Text style={{ fontSize: 12, display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.65)' }}>
                  👥 {p.assigned} assigned
                </Text>
                <Text style={{ fontSize: 12, display: 'block', color: 'rgba(255,255,255,0.65)' }}>
                  Budget: {formatPeso(p.budget)}
                </Text>
                <Text style={{ fontSize: 12, display: 'block', color: 'rgba(255,255,255,0.65)' }}>
                  Remaining: {formatPeso(p.remaining)}
                </Text>
                <Progress
                  percent={p.percentUsedProgress}
                  showInfo={false}
                  strokeColor="#009944"
                  size="small"
                  style={{ marginTop: 8 }}
                />
                <Text style={{ fontSize: 12, color: '#52c41a' }}>
                  {p.percentUsedLabel}% used
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
