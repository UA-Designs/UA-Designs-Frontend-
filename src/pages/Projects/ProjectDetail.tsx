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
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { projectService, ProjectDashboardData } from '../../services/projectService';
import { Project } from '../../types';

const { Text } = Typography;
const { Option } = Select;

const statusConfig: Record<string, { color: string; label: string }> = {
  planning:    { color: 'blue',    label: 'Planning' },
  active:      { color: 'green',   label: 'Active' },
  in_progress: { color: 'cyan',    label: 'In Progress' },
  on_hold:     { color: 'orange',  label: 'On Hold' },
  completed:   { color: 'purple',  label: 'Completed' },
  cancelled:   { color: 'red',     label: 'Cancelled' },
};

const formatCurrency = (v?: number) =>
  v !== undefined ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] = useState<ProjectDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [proj, dash] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectDashboard(projectId).catch(() => null),
        ]);
        if (!cancelled) {
          setProject(proj);
          setDashboardData(dash);
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
  const spent = (project as any).actualCost ?? 0;
  const remaining = Math.max(0, budget - spent);
  const pctUsed = budget ? Math.round((spent / budget) * 100) : 0;
  const teamMembers = (project as any).teamMembers ?? [];
  const boqCount = dashboardData?.pmbokCoreAreas?.cost?.count ?? dashboardData?.budgetCount ?? 0;
  const usageCount = (dashboardData as any)?.usageRecordsCount ?? 0;
  const expenseCount = (dashboardData as any)?.expenseCount ?? 0;

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
    { key: 'boq', label: <>BOQ <BankOutlined /></>, children: <div style={{ padding: 24, color: '#aaa' }}>BOQ content — use PMBOK Cost / BOQ from navigation.</div> },
    { key: 'site', label: <>Site Usage <BarChartOutlined /></>, children: <div style={{ padding: 24, color: '#aaa' }}>Site usage — link to resources or schedule.</div> },
    { key: 'variance', label: <>Variance <LineChartOutlined /></>, children: <div style={{ padding: 24, color: '#aaa' }}>Variance — link to Cost / Variance.</div> },
    { key: 'expenses', label: <>Expenses <FundOutlined /></>, children: <div style={{ padding: 24, color: '#aaa' }}>Expenses — use PMBOK Cost from navigation.</div> },
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
