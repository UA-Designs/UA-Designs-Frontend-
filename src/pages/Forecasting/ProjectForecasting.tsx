import React, { useEffect } from 'react';
import { Button, Grid, Typography } from 'antd';
import { ArrowLeftOutlined, LineChartOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import ProjectForecastDashboard from './components/ProjectForecastDashboard';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ProjectForecasting: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const { projects, selectedProject } = useProject();

  const project =
    projects.find(p => p.id === projectId) ||
    (selectedProject?.id === projectId ? selectedProject : null);

  useEffect(() => {
    if (!projectId) navigate('/forecasting', { replace: true });
  }, [projectId, navigate]);

  if (!projectId) return null;

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', minHeight: '100vh' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/forecasting')}
        style={{ color: '#009944', marginBottom: 12, padding: 0 }}
      >
        Back to Forecasting
      </Button>
      <div style={{ marginBottom: 20 }}>
        <Title level={2} style={{ color: '#fff', margin: 0, lineHeight: 1.2 }}>
          <LineChartOutlined style={{ color: '#00cc66', marginRight: 10 }} />
          {project?.name || 'Project forecast'}
        </Title>
        <Text style={{ color: '#888' }}>
          Engine forecast for this project. Values are displayed from the API only.
        </Text>
      </div>
      <ProjectForecastDashboard projectId={projectId} />
    </div>
  );
};

export default ProjectForecasting;
