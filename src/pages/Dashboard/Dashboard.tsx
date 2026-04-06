import React, { useCallback, useEffect, useState } from 'react';
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
import { costService } from '../../services/costService';
import type { DashboardStats } from '../../types';

const { useBreakpoint } = Grid;
const { Text } = Typography;

const formatPeso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatPesoK = (v: number) => (v >= 1_000_000 ? `P${(v / 1_000_000).toFixed(0)}M` : `P${(v / 1_000).toFixed(0)}K`);
const toNumberLoose = (v: any): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v === null || v === undefined) return 0;
  const cleaned = String(v).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectStats, setProjectStats] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [boqTotalByProject, setBoqTotalByProject] = useState<Record<string, number>>({});
  const [budgetTotalByProject, setBudgetTotalByProject] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [statsData, projectStatsData, projectsResp, costs, budgets] = await Promise.all([
        dashboardService.getStats().catch(() => null),
        projectService.getProjectStats().catch(() => null),
        projectService.getProjectsFiltered().catch(() => ({ projects: [], pagination: { total: 0 } })),
        costService.getCosts().catch(() => []),
        costService.getBudgets().catch(() => []),
      ]);
      if (statsData) setStats(statsData);
      if (projectStatsData) setProjectStats(projectStatsData);
      setProjects((projectsResp as any).projects || []);
      // BOQ total per project (so dashboard shows % used when only BOQ is added)
      const byProject: Record<string, number> = {};
      (costs || []).forEach((c: any) => {
        const id = c.projectId ?? c.project_id;
        if (id) {
          const key = String(id).toLowerCase();
          byProject[key] = (byProject[key] ?? 0) + (Number(c.amount) || 0);
        }
      });
      setBoqTotalByProject(byProject);

      const budgetByProject: Record<string, number> = {};
      (budgets || []).forEach((b: any) => {
        const id = b.projectId ?? b.project_id;
        if (!id) return;
        const key = String(id).toLowerCase();
        const amount = toNumberLoose(b.amount ?? b.totalBudget ?? b.total_budget ?? b.budget);
        if (amount > 0) budgetByProject[key] = (budgetByProject[key] ?? 0) + amount;
      });
      setBudgetTotalByProject(budgetByProject);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when user returns to the tab so Total Budget, Total Spent, Active Projects stay up to date
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchData]);

  // Spent = API actualCost when present, else BOQ total so adding BOQ updates dashboard %
  const getSpent = (p: any) => {
    const apiSpent = Number(p?.actualCost ?? 0);
    if (apiSpent > 0) return apiSpent;
    const pid = String(p?.id ?? p?._id ?? '').toLowerCase();
    return boqTotalByProject[pid] ?? 0;
  };

  const getBudget = (p: any) => {
    const direct = toNumberLoose(
      p?.budget ??
      p?.budget_amount ??
      p?.totalBudget ??
      p?.total_budget ??
      p?.projectBudget ??
      p?.project_budget ??
      p?.approvedBudget ??
      p?.approved_budget
    );
    if (direct > 0) return direct;
    const pid = String(p?.id ?? p?._id ?? '').toLowerCase();
    return budgetTotalByProject[pid] ?? 0;
  };

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
          const budget = getBudget(p);
          const spent = getSpent(p);
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
          const spent = getSpent(p);
          const budget = getBudget(p);
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

  // Prefer totals derived from the projects list so cards stay in sync with what we display
  const derivedBudget = projects.reduce((sum, p) => sum + getBudget(p), 0);
  const derivedSpent = projects.reduce((sum, p) => sum + getSpent(p), 0);
  const derivedActive = projects.filter((p) => {
    const s = String((p as any).status ?? '').toLowerCase();
    const inactive = ['completed', 'cancelled', 'closed', 'done', 'terminated'];
    if (inactive.includes(s)) return false;
    return true; // count as active if not explicitly inactive (includes "active", "in progress", or empty)
  }).length;
  const totalBudget = projects.length > 0 ? derivedBudget : (projectStats?.totalBudget ?? stats?.totalBudget ?? 0);
  const totalSpent = projects.length > 0 ? derivedSpent : (projectStats?.spentBudget ?? stats?.actualCost ?? 0);
  const activeProjects = projects.length > 0 ? derivedActive : (projectStats?.activeProjects ?? stats?.activeProjects ?? 0);
  const overBudgetCount = projects.filter((p) => {
    const b = getBudget(p);
    const s = getSpent(p);
    return b > 0 && s > b;
  }).length;

  const ALERT_50_PCT = 50;
  const ALERT_80_PCT = 80;

  // BOQ: single "Overall" row from real totals (no per-category on dashboard)
  const overallPctUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overallNoBudget = totalBudget <= 0;
  const overallIsCritical = totalBudget > 0 && totalSpent > totalBudget;
  const overallAt80 = totalBudget > 0 && !overallIsCritical && overallPctUsed >= ALERT_80_PCT;
  const overallAt50 = totalBudget > 0 && !overallIsCritical && !overallAt80 && overallPctUsed >= ALERT_50_PCT;
  const overallStatus = overallIsCritical
    ? 'Critical'
    : overallNoBudget
      ? 'Warning'
      : overallAt80
        ? 'Warning (80%)'
        : overallAt50
          ? 'Warning (50%)'
          : 'On Track';
  const overallStatusColor = overallIsCritical ? 'red' : overallNoBudget ? 'gold' : (overallAt80 || overallAt50) ? 'orange' : 'green';
  const boqCategoriesFromData = [
    {
      key: 'overall',
      label: 'Overall',
      icon: '📊',
      iconColor: '#009944',
      spent: totalSpent,
      budget: totalBudget,
      status: overallStatus,
      statusColor: overallStatusColor,
      variance:
        totalBudget > 0
          ? totalSpent > totalBudget
            ? `Over by ${formatPeso(totalSpent - totalBudget)}`
            : `Under by ${formatPeso(totalBudget - totalSpent)}`
          : 'No budget set',
    },
  ];
  const tradeAlertsFromData = projects.map((p) => {
    const budget = getBudget(p);
    const spent = getSpent(p);
    const pct = budget > 0 ? (spent / budget) * 100 : 0;
    const noBudget = budget <= 0;
    const over = budget > 0 && spent > budget;
    const at80 = budget > 0 && !over && pct >= ALERT_80_PCT;
    const at50 = budget > 0 && !over && !at80 && pct >= ALERT_50_PCT;
    const status = over ? 'critical' : noBudget ? 'warning-no-budget' : at80 ? 'warning-80' : at50 ? 'warning-50' : 'on-track';
    const statusTag = over ? 'Critical' : noBudget ? 'Warning: No Budget' : at80 ? 'Warning (80%)' : at50 ? 'Warning (50%)' : 'On Track';
    const color = over ? '#ff4d4f' : noBudget ? '#faad14' : at80 ? '#fa8c16' : at50 ? '#faad14' : '#52c41a';
    return {
      name: p.name || p.projectName || 'Unnamed Project',
      status,
      statusTag,
      color,
      spent,
      budget,
      percent: pct,
      icon: '📁',
    };
  });
  const tradeNeedAttentionCount = tradeAlertsFromData.filter((t) => t.status !== 'on-track').length;

  const criticalAlertsFromData = projects
    .filter((p) => {
      const b = getBudget(p);
      const s = getSpent(p);
      return b > 0 && s > b;
    })
    .map((p) => {
      const budget = getBudget(p);
      const spent = getSpent(p);
      const overBy = spent - budget;
      const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      return {
        project: p.name || p.projectName || 'Unnamed Project',
        type: 'Project',
        item: 'Budget vs actual',
        detail: `Spent ${formatPeso(spent)} of ${formatPeso(budget)} (Over by ${formatPeso(overBy)})`,
        percent,
        status: 'OVER',
        barColor: '#ff4d4f',
      };
    });

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
        {boqCategoriesFromData.map((cat) => {
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
                {tradeNeedAttentionCount > 0 && <Tag color="red">{tradeNeedAttentionCount} need attention</Tag>}
              </span>
            }
            style={{ marginBottom: 24, height: '100%', ...cardStyle }}
          >
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {tradeAlertsFromData.length === 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>No projects yet. Alerts will show when projects are over or near budget.</Text>
              ) : (
                tradeAlertsFromData.map((t) => {
                  const pct = t.budget > 0 ? Math.min(100, t.percent) : 0;
                  const tagColor =
                    t.status === 'critical'
                      ? 'red'
                      : t.status === 'warning-80'
                        ? 'orange'
                        : t.status === 'warning-50' || t.status === 'warning-no-budget'
                          ? 'gold'
                          : 'green';
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
                          <Tag color={tagColor}>{t.statusTag}</Tag>
                        </div>
                        <Progress percent={Math.round(pct)} showInfo={false} strokeColor={t.color} size="small" style={{ marginTop: 4 }} />
                        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                          P{Number(t.spent).toLocaleString()} / P{Number(t.budget).toLocaleString()}
                        </Text>
                      </div>
                      <DownOutlined style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>

        {/* Critical Budget Alerts + Budget vs Actual */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                <WarningOutlined />
                Critical Budget Alerts ({criticalAlertsFromData.length})
              </span>
            }
            style={{ marginBottom: 24, ...cardStyle }}
          >
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {criticalAlertsFromData.length === 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.65)' }}>No critical budget alerts. All projects are within budget.</Text>
              ) : (
                criticalAlertsFromData.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 0',
                      borderBottom: i < criticalAlertsFromData.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    }}
                  >
                    {a.project && (
                      <Text style={{ fontSize: 12, display: 'block', marginBottom: 4, color: 'rgba(255,255,255,0.65)' }}>{a.project}</Text>
                    )}
                    <Text strong style={{ fontSize: 13, color: '#fff' }}>
                      {a.type}: {a.item}
                    </Text>
                    {'usage' in a && a.usage && <Text style={{ fontSize: 12, display: 'block', color: 'rgba(255,255,255,0.65)' }}>{a.usage}</Text>}
                    {a.detail && <Text style={{ fontSize: 12, display: 'block', color: 'rgba(255,255,255,0.65)' }}>{a.detail}</Text>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <Progress percent={Math.min(100, a.percent)} showInfo={false} strokeColor={a.barColor} size="small" style={{ flex: 1 }} />
                      {a.status && <Tag color="red">{a.status}</Tag>}
                      <Text style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{a.percent}%</Text>
                    </div>
                  </div>
                ))
              )}
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
