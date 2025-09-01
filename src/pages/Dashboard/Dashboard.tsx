import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Alert } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import {
  DashboardStats,
  ProjectProgress,
  TaskProgress,
  CostVariance,
} from '../../types';
import { dashboardService } from '../../services/dashboardService';
import QuickActions from '../../components/Dashboard/QuickActions';
import RecentActivities from '../../components/Dashboard/RecentActivities';
import CostVarianceChart from '../../components/Charts/CostVarianceChart';
import ProjectGanttChart from '../../components/Charts/ProjectGanttChart';
import RiskMatrix from '../../components/Charts/RiskMatrix';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectProgress, setProjectProgress] = useState<ProjectProgress[]>([]);
  const [, setTaskProgress] = useState<TaskProgress[]>([]);
  const [costVariance, setCostVariance] = useState<CostVariance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch real data from API
        const [statsData, projectData, taskData, costData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getProjectProgress(),
          dashboardService.getTaskProgress(),
          dashboardService.getCostVariance(),
        ]);

        setStats(statsData);
        setProjectProgress(projectData);
        setTaskProgress(taskData);
        setCostVariance(costData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
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
        style={{ margin: '20px 0' }}
      />
    );
  }

  return (
    <div 
      style={{ 
        padding: '24px',
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 204, 102, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 204, 102, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(0, 204, 102, 0.06) 0%, transparent 50%),
          linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
        `,
        position: 'relative',
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '10%',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(0, 204, 102, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(0, 204, 102, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite reverse',
        }}
      />

      <Row gutter={[24, 24]}>
        {/* Statistics Cards */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 204, 102, 0.25), 0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontWeight: '500' }}>Total Projects</span>}
              value={stats?.totalProjects || 0}
              prefix={<ProjectOutlined style={{ color: '#009944' }} />}
              valueStyle={{ color: '#009944', fontSize: '24px', fontWeight: '700' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 204, 102, 0.25), 0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontWeight: '500' }}>Active Projects</span>}
              value={stats?.activeProjects || 0}
              prefix={<CheckCircleOutlined style={{ color: '#009944' }} />}
              valueStyle={{ color: '#009944', fontSize: '24px', fontWeight: '700' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 204, 102, 0.25), 0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontWeight: '500' }}>Completed Tasks</span>}
              value={stats?.completedTasks || 0}
              prefix={<ClockCircleOutlined style={{ color: '#009944' }} />}
              valueStyle={{ color: '#009944', fontSize: '24px', fontWeight: '700' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
            }}
            hoverable
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 204, 102, 0.25), 0 6px 20px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)';
            }}
          >
            <Statistic
              title={<span style={{ color: '#ffffff', fontWeight: '500' }}>Total Budget</span>}
              value={stats?.totalBudget || 0}
              prefix={<DollarOutlined style={{ color: '#009944' }} />}
              precision={2}
              valueStyle={{ color: '#009944', fontSize: '24px', fontWeight: '700' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {/* Cost Variance */}
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#ffffff', fontWeight: '600' }}>Cost Variance</span>}
            style={{ 
              height: 400,
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Statistic
              title={<span style={{ color: '#b3b3b3', fontWeight: '500' }}>Current Variance</span>}
              value={stats?.costVariance || 0}
              precision={2}
              prefix={
                stats?.costVariance && stats.costVariance > 0 ? (
                  <RiseOutlined style={{ color: '#ff4d4f' }} />
                ) : (
                  <FallOutlined style={{ color: '#009944' }} />
                )
              }
              valueStyle={{
                color:
                  stats?.costVariance && stats.costVariance > 0
                    ? '#ff4d4f'
                    : '#009944',
                fontSize: '20px',
                fontWeight: '700',
              }}
              suffix="%"
            />
            <div style={{ marginTop: 20 }}>
              <CostVarianceChart data={costVariance} />
            </div>
          </Card>
        </Col>

        {/* Schedule Variance */}
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#ffffff', fontWeight: '600' }}>Schedule Performance</span>}
            style={{ 
              height: 400,
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Statistic
              title={<span style={{ color: '#b3b3b3', fontWeight: '500' }}>Schedule Variance</span>}
              value={stats?.scheduleVariance || 0}
              precision={2}
              prefix={
                stats?.scheduleVariance && stats.scheduleVariance > 0 ? (
                  <RiseOutlined style={{ color: '#ff4d4f' }} />
                ) : (
                  <FallOutlined style={{ color: '#009944' }} />
                )
              }
              valueStyle={{
                color:
                  stats?.scheduleVariance && stats.scheduleVariance > 0
                    ? '#ff4d4f'
                    : '#009944',
                fontSize: '20px',
                fontWeight: '700',
              }}
              suffix="%"
            />
            <div style={{ marginTop: 20 }}>
              <ProjectGanttChart data={projectProgress} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {/* Risk Matrix */}
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#ffffff', fontWeight: '600' }}>Risk Matrix</span>}
            style={{ 
              height: 400,
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <RiskMatrix />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ color: '#ffffff', fontWeight: '600' }}>Quick Actions</span>}
            style={{ 
              height: 400,
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <QuickActions />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {/* Recent Activities */}
        <Col xs={24}>
          <Card 
            title={<span style={{ color: '#ffffff', fontWeight: '600' }}>Recent Activities</span>}
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <RecentActivities />
          </Card>
        </Col>
      </Row>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(3deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
