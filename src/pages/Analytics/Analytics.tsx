import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Typography,
  Button,
  Skeleton,
  Alert,
  Tooltip,
} from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import type { AnalyticsOverview } from '../../types/analytics';
import { KpiGrid } from './components/KpiGrid';
import { TaskDistributionChart } from './components/TaskDistributionChart';
import { ExpensesByCategoryChart } from './components/ExpensesByCategoryChart';
import { MonthlySpendingChart } from './components/MonthlySpendingChart';
import { RecentActivityFeed } from './components/RecentActivityFeed';
import { useProject } from '../../contexts/ProjectContext';

const { Title, Text } = Typography;

const KpiSkeleton: React.FC = () => (
  <Row gutter={[16, 16]}>
    {[0, 1, 2, 3].map((i) => (
      <Col xs={12} lg={6} key={i}>
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
        </div>
      </Col>
    ))}
  </Row>
);

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

const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = useProject();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getOverview();
      setOverview(res.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
            <BarChartOutlined style={{ color: '#00cc66', marginRight: 10 }} />
            Analytics Overview
          </Title>
          <Text style={{ color: '#666', fontSize: 13 }}>
            Global project portfolio performance &amp; KPIs
            {lastUpdated && (
              <> &middot; updated {lastUpdated.toLocaleTimeString()}</>
            )}
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <Tooltip title="View per-project deep-dive analytics">
              <Button
                icon={<ProjectOutlined />}
                onClick={() => navigate(`/projects/${projects[0].id}/analytics`)}
                style={{
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#60a5fa',
                  borderRadius: 8,
                }}
              >
                Project Analytics
              </Button>
            </Tooltip>
          )}
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchOverview}
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
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          action={
            <Button size="small" onClick={fetchOverview} style={{ color: '#ef4444' }}>
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

      <div style={{ marginBottom: 24 }}>
        {loading || !overview ? <KpiSkeleton /> : <KpiGrid kpis={overview.kpis} />}
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          {loading || !overview ? (
            <ChartSkeleton height={320} />
          ) : (
            <TaskDistributionChart distribution={overview.taskDistribution} />
          )}
        </Col>
        <Col xs={24} lg={12}>
          {loading || !overview ? (
            <ChartSkeleton height={320} />
          ) : (
            <ExpensesByCategoryChart expenses={overview.expensesByCategory} />
          )}
        </Col>
      </Row>

      <div style={{ marginBottom: 20 }}>
        {loading || !overview ? (
          <ChartSkeleton height={270} />
        ) : (
          <MonthlySpendingChart data={overview.monthlySpending} />
        )}
      </div>

      <div>
        {loading || !overview ? (
          <ChartSkeleton height={340} />
        ) : (
          <RecentActivityFeed activities={overview.recentActivity} />
        )}
      </div>
    </div>
  );
};

export default Analytics;
