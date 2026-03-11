import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Typography,
  Button,
  Skeleton,
  Alert,
  Select,
  Space,
  Grid,
} from 'antd';
import {
  BarChartOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import type { ProjectAnalytics } from '../../types/analytics';
import { ProjectInfoHeader } from './components/ProjectInfoHeader';
import { BudgetGauge } from './components/BudgetGauge';
import { TaskDistributionChart } from './components/TaskDistributionChart';
import { ExpensesByCategoryChart } from './components/ExpensesByCategoryChart';
import { MonthlySpendingChart } from './components/MonthlySpendingChart';
import { RecentActivityFeed } from './components/RecentActivityFeed';
import { useProject } from '../../contexts/ProjectContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 260 }) => (
  <div
    style={{
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '24px',
      height,
    }}
  >
    <Skeleton active paragraph={{ rows: 6 }} title={{ width: '40%' }} />
  </div>
);

const ProjectAnalyticsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useProject();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getProjectAnalytics(id);
      setAnalytics(res.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load project analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (projectId) {
      fetchAnalytics(projectId);
      interval = setInterval(() => fetchAnalytics(projectId), 5 * 60 * 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [projectId, fetchAnalytics]);

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', minHeight: '100vh' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/analytics')}
            style={{ color: '#888', marginBottom: 8, padding: 0 }}
          >
            Back to Analytics Overview
          </Button>
          <Title level={2} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
            <BarChartOutlined style={{ color: '#00cc66', marginRight: 10 }} />
            Project Analytics
          </Title>
          <Text style={{ color: '#666', fontSize: 13 }}>
            Deep-dive performance metrics for this project
            {lastUpdated && <> &middot; updated {lastUpdated.toLocaleTimeString()}</>}
          </Text>
        </div>

        <Space wrap style={isMobile ? { width: '100%' } : undefined}>
          {/* Project switcher */}
          <Select
            value={projectId}
            onChange={(val) => navigate(`/projects/${val}/analytics`)}
            style={{ width: isMobile ? '100%' : 220, minWidth: isMobile ? 0 : 220 }}
            placeholder="Switch project"
          >
            {projects.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.name}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => projectId && fetchAnalytics(projectId)}
            disabled={loading}
            style={{
              background: 'rgba(0,204,102,0.1)',
              border: '1px solid rgba(0,204,102,0.3)',
              color: '#00cc66',
              borderRadius: 8,
            }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          type="error"
          message={error}
          action={
            <Button
              size="small"
              onClick={() => projectId && fetchAnalytics(projectId)}
              style={{ color: '#ef4444' }}
            >
              Retry
            </Button>
          }
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            marginBottom: 24,
          }}
          closable
        />
      )}

      {/* ── Project Info Header ──────────────────────────────────────────── */}
      {loading || !analytics ? (
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ) : (
        <ProjectInfoHeader project={analytics.project} />
      )}

      {/* ── Budget + Task Summary ─────────────────────────────────────────── */}
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          {loading || !analytics ? (
            <ChartSkeleton height={220} />
          ) : (
            <BudgetGauge budget={analytics.budget} />
          )}
        </Col>
        <Col xs={24} lg={12}>
          {loading || !analytics ? (
            <ChartSkeleton height={320} />
          ) : (
            <TaskDistributionChart distribution={analytics.taskSummary.distribution} />
          )}
        </Col>
      </Row>

      {/* ── Expenses by Category + Monthly Spending ──────────────────────── */}
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          {loading || !analytics ? (
            <ChartSkeleton height={290} />
          ) : (
            <ExpensesByCategoryChart expenses={analytics.expensesByCategory} />
          )}
        </Col>
        <Col xs={24} lg={12}>
          {loading || !analytics ? (
            <ChartSkeleton height={270} />
          ) : (
            <MonthlySpendingChart data={analytics.monthlySpending} />
          )}
        </Col>
      </Row>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <div>
        {loading || !analytics ? (
          <ChartSkeleton height={340} />
        ) : (
          <RecentActivityFeed activities={analytics.recentActivity} />
        )}
      </div>
    </div>
  );
};

export default ProjectAnalyticsPage;
