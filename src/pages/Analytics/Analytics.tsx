import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Typography,
  Button,
  Skeleton,
  Alert,
  Grid,
} from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { analyticsService } from '../../services/analyticsService';
import type { AnalyticsOverview } from '../../types/analytics';
import { BudgetVsActualByProjectChart } from './components/BudgetVsActualByProjectChart';
import { ExpensesByCategoryChart } from './components/ExpensesByCategoryChart';
import { useProject } from '../../contexts/ProjectContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 320 }) => (
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
  const { projects } = useProject();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getOverview();
      setOverview(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', minHeight: '100vh' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
            <BarChartOutlined style={{ color: '#00cc66', marginRight: 10 }} />
            Analytics &amp; Reports
          </Title>
          <Text style={{ color: '#666', fontSize: 13 }}>
            Budget vs actual by project and expenses by category
          </Text>
        </div>
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

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          {loading ? (
            <ChartSkeleton height={360} />
          ) : (
            <BudgetVsActualByProjectChart projects={projects} />
          )}
        </Col>
        <Col xs={24} lg={12}>
          {loading || !overview ? (
            <ChartSkeleton height={360} />
          ) : (
            <ExpensesByCategoryChart expenses={overview.expensesByCategory} />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
