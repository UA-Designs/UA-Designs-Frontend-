import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Grid,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from 'antd';
import { LineChartOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import {
  AtRiskForecastItem,
  forecastService,
} from '../../services/forecastService';
import { useProject } from '../../contexts/ProjectContext';
import ForecastStatusBadge from './components/ForecastStatusBadge';
import { fmtDays, fmtPhp } from './forecastFormat';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const cardStyle: React.CSSProperties = {
  background: '#1f1f1f',
  border: '1px solid rgba(0,153,68,0.2)',
  borderRadius: 12,
};

const Forecasting: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const { projects, selectedProject, setSelectedProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AtRiskForecastItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forecastService.getAtRiskForecasts();
      setRows(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load at-risk forecasts.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goToProject = (projectId: string) => {
    const match = projects.find(p => p.id === projectId);
    if (match) setSelectedProject(match);
    navigate(`/projects/${projectId}/forecasting`);
  };

  const columns: ColumnsType<AtRiskForecastItem> = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      render: (name: string | null, row) => (
        <Button type="link" onClick={() => goToProject(row.projectId)} style={{ color: '#00cc66', padding: 0 }}>
          {name || row.projectId}
        </Button>
      ),
    },
    {
      title: 'Overall',
      dataIndex: 'overallStatus',
      render: (v: string) => <ForecastStatusBadge status={v} />,
    },
    {
      title: 'Cost',
      dataIndex: 'costStatus',
      render: (v: string) => <ForecastStatusBadge status={v} />,
    },
    {
      title: 'Schedule',
      dataIndex: 'scheduleStatus',
      render: (v: string) => <ForecastStatusBadge status={v} />,
    },
    {
      title: 'Expected overrun',
      dataIndex: 'expectedOverrun',
      render: (v: number | null) => <Text style={{ color: '#fff' }}>{fmtPhp(v)}</Text>,
    },
    {
      title: 'Expected delay',
      dataIndex: 'expectedDelayDays',
      render: (v: number | null) => <Text style={{ color: '#fff' }}>{fmtDays(v)}</Text>,
    },
    {
      title: '',
      key: 'open',
      width: 48,
      render: (_, row) => (
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={() => goToProject(row.projectId)}
          style={{ color: '#009944' }}
        />
      ),
    },
  ];

  const atRiskCount = rows.filter(r => {
    const s = (r.overallStatus || '').toUpperCase();
    return s && s !== 'ON_TRACK' && s !== 'UNAVAILABLE' && s !== 'INSUFFICIENT_DATA';
  }).length;

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', minHeight: '100vh' }}>
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
          <Title level={2} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
            <LineChartOutlined style={{ color: '#00cc66', marginRight: 10 }} />
            Forecasting
          </Title>
          <Text style={{ color: '#888' }}>
            Portfolio at-risk overview from the forecast engine. Figures are API results only.
          </Text>
        </div>
        <Space wrap>
          <Select
            showSearch
            placeholder="Open a project forecast"
            style={{ minWidth: isMobile ? '100%' : 280 }}
            value={selectedProject?.id}
            optionFilterProp="label"
            onChange={goToProject}
            options={(projects || []).map(p => ({ value: p.id, label: p.name }))}
          />
          <Button onClick={load}>Refresh</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card style={cardStyle}>
            <Text style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>
              At-risk projects
            </Text>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>
              {loading ? '—' : atRiskCount}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={cardStyle}>
            <Text style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>
              Listed by API
            </Text>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
              {loading ? '—' : rows.length}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={cardStyle}>
            <Text style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>
              Selected project
            </Text>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#00cc66', marginTop: 8 }}>
              {selectedProject?.name || 'None'}
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={cardStyle} title="At-risk overview">
        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{ marginBottom: 16 }}
          />
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : rows.length === 0 ? (
          <Empty
            description={
              <Text style={{ color: '#888' }}>
                No at-risk forecasts returned. Pick a project to open its forecast dashboard.
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            rowKey="projectId"
            dataSource={rows}
            columns={columns}
            pagination={false}
            scroll={{ x: 720 }}
            size="small"
          />
        )}
      </Card>
    </div>
  );
};

export default Forecasting;
