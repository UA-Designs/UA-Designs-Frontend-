import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  LineChartOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  forecastService,
  ForecastAlert,
  ForecastHistorySnapshot,
  ForecastRequestError,
  mergeProjectForecast,
  NormalizedProjectForecast,
} from '../../../services/forecastService';
import { Can } from '../../../components/rbac/Can';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForecastStatusBadge from './ForecastStatusBadge';
import WhatIfPanel from './WhatIfPanel';
import {
  CostTimelineChart,
  ForecastTrendChart,
  ProgressTimelineChart,
  ScheduleCompareChart,
} from './ForecastCharts';
import {
  fmtDate,
  fmtDays,
  fmtIndex,
  fmtNumber,
  fmtPct,
  fmtPhp,
} from '../forecastFormat';

const { Text, Title } = Typography;

const cardStyle: React.CSSProperties = {
  background: '#1f1f1f',
  border: '1px solid rgba(0,153,68,0.2)',
  borderRadius: 12,
};

const metricLabel: React.CSSProperties = {
  color: '#888',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'block',
  marginBottom: 4,
};

const metricValue: React.CSSProperties = {
  color: '#fff',
  fontSize: 18,
  fontWeight: 600,
  lineHeight: 1.2,
};

interface Metric {
  label: string;
  value: string;
}

const MetricGrid: React.FC<{ items: Metric[] }> = ({ items }) => (
  <Row gutter={[16, 16]}>
    {items.map(item => (
      <Col xs={12} sm={8} md={6} lg={4} key={item.label}>
        <Text style={metricLabel}>{item.label}</Text>
        <div style={metricValue}>{item.value}</div>
      </Col>
    ))}
  </Row>
);

const severityColor = (severity?: string) => {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
    case 'ERROR':
    case 'DANGER':
      return 'red';
    case 'WARNING':
    case 'MEDIUM':
    case 'AT_RISK':
      return 'gold';
    case 'INFO':
    case 'LOW':
      return 'blue';
    default:
      return 'default';
  }
};

function qualityLine(item: unknown, index: number): { key: string; text: string } | null {
  if (item == null) return null;
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const text = String(item).trim();
    return text ? { key: `s-${index}-${text}`, text } : null;
  }
  if (typeof item !== 'object') return null;
  const rec = item as Record<string, unknown>;
  const field = typeof rec.field === 'string' ? rec.field : '';
  const message =
    typeof rec.message === 'string'
      ? rec.message
      : typeof rec.title === 'string'
        ? rec.title
        : '';
  const severity = typeof rec.severity === 'string' ? rec.severity : '';
  const text = [severity, field, message].filter(Boolean).join(' — ');
  return text ? { key: `o-${index}-${text}`, text } : null;
}

const DataQualityBanner: React.FC<{ forecast: NormalizedProjectForecast }> = ({
  forecast,
}) => {
  if (!forecast.insufficient) return null;
  const lines = [
    ...(forecast.dataQuality.missingData ?? []),
    ...(forecast.dataQuality.issues ?? []),
  ]
    .map(qualityLine)
    .filter((row): row is { key: string; text: string } => row != null);

  return (
    <Alert
      type="warning"
      showIcon
      message="Insufficient data to produce a forecast"
      description={
        <div>
          <Text style={{ color: '#bbb' }}>
            Cards show n/a until the API has enough project data. No estimated
            figures are displayed.
          </Text>
          {lines.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#bbb' }}>
              {lines.map(row => (
                <li key={row.key}>{row.text}</li>
              ))}
            </ul>
          )}
        </div>
      }
    />
  );
};

const SliceCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  status?: string | null;
  items: Metric[];
}> = ({ title, icon, status, items }) => (
  <Card
    style={cardStyle}
    title={
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        {title}
      </span>
    }
    extra={status ? <ForecastStatusBadge status={status} /> : undefined}
  >
    <MetricGrid items={items} />
  </Card>
);

const alertColumns: ColumnsType<ForecastAlert> = [
  {
    title: 'Severity',
    dataIndex: 'severity',
    width: 110,
    render: (v: string) => <Tag color={severityColor(v)}>{v || '—'}</Tag>,
  },
  {
    title: 'Title',
    dataIndex: 'title',
    render: (v: string, row) => (
      <Text style={{ color: '#fff' }}>{v || row.type || 'Alert'}</Text>
    ),
  },
  {
    title: 'Message',
    dataIndex: 'message',
    render: (v: string) => <Text style={{ color: '#bbb' }}>{v || '—'}</Text>,
  },
  {
    title: 'Metric',
    dataIndex: 'metric',
    width: 120,
    render: (v: string) => <Text style={{ color: '#888' }}>{v || '—'}</Text>,
  },
  {
    title: 'Action',
    dataIndex: 'recommendedAction',
    render: (v: string) => <Text style={{ color: '#00cc66' }}>{v || '—'}</Text>,
  },
];

const historyColumns: ColumnsType<ForecastHistorySnapshot> = [
  {
    title: 'Forecast date',
    dataIndex: 'forecastDate',
    render: (v: string) => <Text style={{ color: '#fff' }}>{fmtDate(v)}</Text>,
  },
  {
    title: 'Cost forecast',
    dataIndex: 'costForecastValue',
    render: (v: number | null) => (
      <Text style={{ color: '#fff' }}>{fmtPhp(v)}</Text>
    ),
  },
  {
    title: 'Schedule forecast',
    dataIndex: 'scheduleForecastDate',
    render: (v: string) => <Text style={{ color: '#fff' }}>{fmtDate(v)}</Text>,
  },
  {
    title: 'Progress forecast',
    dataIndex: 'progressForecastValue',
    render: (v: number | null) => (
      <Text style={{ color: '#fff' }}>{fmtPct(v)}</Text>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (v: string) => <ForecastStatusBadge status={v} />,
  },
];

export interface ProjectForecastDashboardProps {
  projectId: string;
  embedded?: boolean;
}

const ProjectForecastDashboard: React.FC<ProjectForecastDashboardProps> = ({
  projectId,
  embedded = false,
}) => {
  const { can } = useAuth();
  const navigate = useNavigate();
  const canEngineer = can('ENGINEER_AND_ABOVE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<NormalizedProjectForecast | null>(null);
  const [alerts, setAlerts] = useState<ForecastAlert[]>([]);
  const [history, setHistory] = useState<ForecastHistorySnapshot[]>([]);
  const [tab, setTab] = useState('overview');
  const [tabPayload, setTabPayload] = useState<unknown>(null);
  const [tabLoading, setTabLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, engine, historyRows, alertRows] = await Promise.all([
        forecastService.getProjectDashboard(projectId).catch(() => null),
        forecastService.getProjectForecast(projectId).catch((err: ForecastRequestError) => {
          if (err.status === 404) return null;
          throw err;
        }),
        forecastService.getForecastHistory(projectId).catch(() => []),
        forecastService.getForecastAlerts(projectId).catch(() => []),
      ]);
      const merged = mergeProjectForecast(dash, engine);
      setForecast(merged);
      setHistory(historyRows);
      setAlerts(alertRows.length ? alertRows : merged.alerts);
    } catch (err: any) {
      setError(err?.message || 'Failed to load forecast.');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadTypeTab = useCallback(
    async (key: string) => {
      if (key === 'overview' || key === 'history' || key === 'alerts' || key === 'whatif') {
        setTabPayload(null);
        return;
      }
      setTabLoading(true);
      try {
        let data: unknown = null;
        if (key === 'cost') data = await forecastService.getCostForecast(projectId);
        if (key === 'schedule') data = await forecastService.getScheduleForecast(projectId);
        if (key === 'progress') data = await forecastService.getProgressForecast(projectId);
        if (key === 'resources') data = await forecastService.getResourceForecast(projectId);
        setTabPayload(data);
      } catch (err: any) {
        setTabPayload({ error: err?.message || 'Failed to load this forecast view.' });
      } finally {
        setTabLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    loadTypeTab(tab);
  }, [tab, loadTypeTab]);

  const handleGenerate = async () => {
    setSaving(true);
    try {
      await forecastService.generateForecastSnapshot(projectId);
      message.success('Forecast snapshot saved.');
      await load();
    } catch (err: any) {
      const status = err instanceof ForecastRequestError ? err.status : err?.status;
      if (status === 403) {
        setError('You do not have permission to save a forecast snapshot.');
      } else {
        setError(err?.message || 'Failed to generate snapshot.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !forecast) {
    return <Alert type="error" showIcon message={error} />;
  }

  if (!forecast) {
    return (
      <Empty
        description="No forecast data returned by the API"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const { cost, schedule, progress, resources, charts, insufficient, methodology } = forecast;

  const overview = (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}
      <DataQualityBanner forecast={forecast} />
      {methodology && (
        <Text style={{ color: '#888', fontSize: 12 }}>Methodology: {methodology}</Text>
      )}
      <SliceCard
        title="Cost"
        icon={<DollarOutlined style={{ color: '#00cc66' }} />}
        status={insufficient ? forecast.overallStatus : cost.status}
        items={[
          { label: 'Budget', value: insufficient ? 'n/a' : fmtPhp(cost.budget) },
          { label: 'Actual cost', value: insufficient ? 'n/a' : fmtPhp(cost.actualCost) },
          {
            label: 'Forecast final cost',
            value: insufficient ? 'n/a' : fmtPhp(cost.forecastFinalCost),
          },
          {
            label: 'Expected overrun',
            value: insufficient ? 'n/a' : fmtPhp(cost.expectedOverrun),
          },
          { label: 'CPI', value: insufficient ? 'n/a' : fmtIndex(cost.cpi) },
        ]}
      />
      <SliceCard
        title="Schedule"
        icon={<CalendarOutlined style={{ color: '#00aaff' }} />}
        status={insufficient ? forecast.overallStatus : schedule.status}
        items={[
          {
            label: 'Planned completion',
            value: insufficient ? 'n/a' : fmtDate(schedule.plannedCompletion),
          },
          {
            label: 'Forecast completion',
            value: insufficient ? 'n/a' : fmtDate(schedule.forecastCompletion),
          },
          {
            label: 'Expected delay',
            value: insufficient ? 'n/a' : fmtDays(schedule.expectedDelayDays),
          },
          { label: 'SPI', value: insufficient ? 'n/a' : fmtIndex(schedule.spi) },
        ]}
      />
      <SliceCard
        title="Progress"
        icon={<LineChartOutlined style={{ color: '#ffaa00' }} />}
        items={[
          {
            label: 'Current progress',
            value: insufficient ? 'n/a' : fmtPct(progress.currentProgress),
          },
          {
            label: 'Planned progress',
            value: insufficient ? 'n/a' : fmtPct(progress.plannedProgress),
          },
          {
            label: 'Forecast progress',
            value: insufficient ? 'n/a' : fmtPct(progress.forecastProgress),
          },
          {
            label: 'Trend',
            value: insufficient ? 'n/a' : progress.trend || 'UNKNOWN',
          },
        ]}
      />
      <SliceCard
        title="Resources"
        icon={<TeamOutlined style={{ color: '#a78bfa' }} />}
        status={insufficient ? forecast.overallStatus : resources.status}
        items={[
          {
            label: 'Current resources',
            value: insufficient ? 'n/a' : fmtNumber(resources.currentResources),
          },
          {
            label: 'Forecast requirement',
            value: insufficient ? 'n/a' : fmtNumber(resources.forecastRequirement),
          },
          {
            label: 'Shortage / surplus',
            value: insufficient ? 'n/a' : fmtNumber(resources.shortageSurplus),
          },
          {
            label: 'Utilization',
            value: insufficient ? 'n/a' : fmtPct(resources.utilization),
          },
        ]}
      />
      {!insufficient && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <CostTimelineChart data={charts.cost} />
          </Col>
          <Col xs={24} lg={12}>
            <ScheduleCompareChart data={charts.schedule} />
          </Col>
          <Col xs={24} lg={12}>
            <ProgressTimelineChart data={charts.progress} />
          </Col>
          <Col xs={24} lg={12}>
            <ForecastTrendChart snapshots={history} />
          </Col>
        </Row>
      )}
    </Space>
  );

  // Prefer structured cards on type tabs when the payload looks like a slice
  const typedOverview = (kind: 'cost' | 'schedule' | 'progress' | 'resources') => {
    if (tabLoading) {
      return (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      );
    }
    const extra = tabPayload && typeof tabPayload === 'object' ? tabPayload : null;
    const merged = extra ? mergeProjectForecast(forecast, extra) : forecast;
    if (kind === 'cost') {
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <SliceCard
            title="Cost forecast"
            icon={<DollarOutlined style={{ color: '#00cc66' }} />}
            status={merged.cost.status}
            items={[
              { label: 'Budget', value: fmtPhp(merged.cost.budget) },
              { label: 'Actual cost', value: fmtPhp(merged.cost.actualCost) },
              { label: 'Forecast final cost', value: fmtPhp(merged.cost.forecastFinalCost) },
              { label: 'Expected overrun', value: fmtPhp(merged.cost.expectedOverrun) },
              { label: 'CPI', value: fmtIndex(merged.cost.cpi) },
            ]}
          />
          <CostTimelineChart data={merged.charts.cost.length ? merged.charts.cost : charts.cost} />
        </Space>
      );
    }
    if (kind === 'schedule') {
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <SliceCard
            title="Schedule forecast"
            icon={<CalendarOutlined style={{ color: '#00aaff' }} />}
            status={merged.schedule.status}
            items={[
              { label: 'Planned completion', value: fmtDate(merged.schedule.plannedCompletion) },
              { label: 'Forecast completion', value: fmtDate(merged.schedule.forecastCompletion) },
              { label: 'Expected delay', value: fmtDays(merged.schedule.expectedDelayDays) },
              { label: 'SPI', value: fmtIndex(merged.schedule.spi) },
            ]}
          />
          <ScheduleCompareChart data={merged.charts.schedule || charts.schedule} />
        </Space>
      );
    }
    if (kind === 'progress') {
      return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <SliceCard
            title="Progress forecast"
            icon={<LineChartOutlined style={{ color: '#ffaa00' }} />}
            items={[
              { label: 'Current progress', value: fmtPct(merged.progress.currentProgress) },
              { label: 'Planned progress', value: fmtPct(merged.progress.plannedProgress) },
              { label: 'Forecast progress', value: fmtPct(merged.progress.forecastProgress) },
              { label: 'Trend', value: merged.progress.trend || 'UNKNOWN' },
            ]}
          />
          <ProgressTimelineChart
            data={merged.charts.progress.length ? merged.charts.progress : charts.progress}
          />
        </Space>
      );
    }
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <SliceCard
          title="Resource forecast"
          icon={<TeamOutlined style={{ color: '#a78bfa' }} />}
          status={merged.resources.status}
          items={[
            { label: 'Current resources', value: fmtNumber(merged.resources.currentResources) },
            { label: 'Forecast requirement', value: fmtNumber(merged.resources.forecastRequirement) },
            { label: 'Shortage / surplus', value: fmtNumber(merged.resources.shortageSurplus) },
            { label: 'Utilization', value: fmtPct(merged.resources.utilization) },
          ]}
        />
      </Space>
    );
  };

  return (
    <div>
      {!embedded && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Button icon={<ReloadOutlined />} onClick={load}>
            Refresh
          </Button>
          <Can access="ENGINEER_AND_ABOVE">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleGenerate}
              style={{ background: '#009944', borderColor: '#009944' }}
            >
              Save snapshot
            </Button>
          </Can>
        </div>
      )}
      {embedded && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Forecasting
          </Title>
          <Space>
            <Button
              type="link"
              onClick={() => navigate(`/projects/${projectId}/forecasting`)}
              style={{ color: '#009944', padding: 0 }}
            >
              Open full forecast
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} size="small">
              Refresh
            </Button>
            <Can access="ENGINEER_AND_ABOVE">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleGenerate}
                size="small"
                style={{ background: '#009944', borderColor: '#009944' }}
              >
                Save snapshot
              </Button>
            </Can>
          </Space>
        </div>
      )}

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'overview', label: 'Overview', children: overview },
          { key: 'cost', label: 'Cost', children: typedOverview('cost') },
          { key: 'schedule', label: 'Schedule', children: typedOverview('schedule') },
          { key: 'progress', label: 'Progress', children: typedOverview('progress') },
          { key: 'resources', label: 'Resources', children: typedOverview('resources') },
          {
            key: 'alerts',
            label: (
              <span>
                Alerts {alerts.length > 0 && <WarningOutlined style={{ color: '#ffaa00' }} />}
              </span>
            ),
            children: (
              <Card style={cardStyle}>
                {alerts.length === 0 ? (
                  <Empty
                    description="No forecast alerts"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <Table
                    rowKey={(_, i) => String(i)}
                    dataSource={alerts}
                    columns={alertColumns}
                    pagination={false}
                    size="small"
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'history',
            label: 'History',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <ForecastTrendChart snapshots={history} />
                <Card style={cardStyle}>
                  {history.length === 0 ? (
                    <Empty
                      description="No saved snapshots"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Table
                      rowKey={(_, i) => String(i)}
                      dataSource={history}
                      columns={historyColumns}
                      pagination={false}
                      size="small"
                    />
                  )}
                </Card>
              </Space>
            ),
          },
          ...(canEngineer
            ? [
                {
                  key: 'whatif',
                  label: 'What-if',
                  children: <WhatIfPanel projectId={projectId} />,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};

export default ProjectForecastDashboard;
