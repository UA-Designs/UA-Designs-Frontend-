import React from 'react';
import { Row, Col } from 'antd';
import {
  FolderOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { KpiCard } from './KpiCard';
import type { AnalyticsKPIs } from '../../../types/analytics';
import { formatCurrencyShort } from '../../../utils/formatCurrency';

interface KpiGridProps {
  kpis: AnalyticsKPIs;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => (
  <Row gutter={[16, 16]}>
    <Col xs={12} lg={6}>
      <KpiCard
        label="Total Projects"
        value={kpis.totalProjects}
        subtitle={`${kpis.activeProjects} active`}
        icon={<FolderOutlined />}
        color="blue"
      />
    </Col>
    <Col xs={12} lg={6}>
      <KpiCard
        label="Total Budget"
        value={formatCurrencyShort(kpis.totalBudget)}
        subtitle={`${kpis.budgetUtilization.toFixed(1)}% used`}
        icon={<DollarOutlined />}
        color="green"
      />
    </Col>
    <Col xs={12} lg={6}>
      <KpiCard
        label="Total Tasks"
        value={kpis.totalTasks}
        subtitle={`${kpis.taskCompletionRate.toFixed(0)}% done`}
        icon={<CheckSquareOutlined />}
        color="amber"
      />
    </Col>
    <Col xs={12} lg={6}>
      <KpiCard
        label="Team Members"
        value={kpis.activeTeamMembers}
        subtitle="active"
        icon={<TeamOutlined />}
        color="purple"
      />
    </Col>
  </Row>
);
