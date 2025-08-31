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
    <div>
      <Row gutter={[16, 16]}>
        {/* Statistics Cards */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={stats?.totalProjects || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={stats?.activeProjects || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Tasks"
              value={stats?.completedTasks || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={stats?.totalBudget || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Cost Variance */}
        <Col xs={24} lg={12}>
          <Card title="Cost Variance" style={{ height: 400 }}>
            <Statistic
              title="Current Variance"
              value={stats?.costVariance || 0}
              precision={2}
              prefix={
                stats?.costVariance && stats.costVariance > 0 ? (
                  <RiseOutlined />
                ) : (
                  <FallOutlined />
                )
              }
              valueStyle={{
                color:
                  stats?.costVariance && stats.costVariance > 0
                    ? '#ff4d4f'
                    : '#52c41a',
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
          <Card title="Schedule Performance" style={{ height: 400 }}>
            <Statistic
              title="Schedule Variance"
              value={stats?.scheduleVariance || 0}
              precision={2}
              prefix={
                stats?.scheduleVariance && stats.scheduleVariance > 0 ? (
                  <RiseOutlined />
                ) : (
                  <FallOutlined />
                )
              }
              valueStyle={{
                color:
                  stats?.scheduleVariance && stats.scheduleVariance > 0
                    ? '#ff4d4f'
                    : '#52c41a',
              }}
              suffix="%"
            />
            <div style={{ marginTop: 20 }}>
              <ProjectGanttChart data={projectProgress} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Risk Matrix */}
        <Col xs={24} lg={12}>
          <Card title="Risk Matrix" style={{ height: 400 }}>
            <RiskMatrix />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ height: 400 }}>
            <QuickActions />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Recent Activities */}
        <Col xs={24}>
          <Card title="Recent Activities">
            <RecentActivities />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
