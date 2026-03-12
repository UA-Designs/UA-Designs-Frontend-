import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Empty, Typography } from 'antd';
import { ChartCard } from './ChartCard';
import { ChartErrorBoundary } from '../../../components/Charts/ChartErrorBoundary';
import type { Project } from '../../../types';

const { Text } = Typography;

const BUDGET_COLOR = '#1e3a5f';
const SPENT_COLOR = '#e67e22';

interface Props {
  projects: Project[];
}

/** Format Y-axis as P0k, P1500k, etc. */
const formatPesoK = (v: number) => {
  if (v >= 1_000_000) return `P${(v / 1_000_000).toFixed(0)}M`;
  return `P${(v / 1_000).toFixed(0)}k`;
};

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const budget = payload.find((p: any) => p.dataKey === 'budget')?.value ?? 0;
  const spent = payload.find((p: any) => p.dataKey === 'spent')?.value ?? 0;
  return (
    <div
      style={{
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '10px 14px',
      }}
    >
      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ color: BUDGET_COLOR, fontSize: 12 }}>Budget: ₱{Number(budget).toLocaleString()}</div>
      <div style={{ color: SPENT_COLOR, fontSize: 12 }}>Spent: ₱{Number(spent).toLocaleString()}</div>
    </div>
  );
};

export const BudgetVsActualByProjectChart: React.FC<Props> = ({ projects }) => {
  const chartData = (projects || [])
    .filter((p) => (p.budget ?? 0) > 0 || (p.actualCost ?? 0) > 0)
    .map((p) => ({
      name: p.name?.length > 18 ? `${p.name.slice(0, 18)}...` : p.name || 'Unnamed',
      fullName: p.name,
      budget: p.budget ?? 0,
      spent: p.actualCost ?? 0,
    }));

  return (
    <ChartCard title="Budget vs Actual by Project">
      {chartData.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No project budget data yet</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <ChartErrorBoundary height={320}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
              barGap={4}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#666', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: '#666', fontSize: 11 }}
                tickFormatter={formatPesoK}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend
                iconType="rect"
                iconSize={12}
                formatter={(value) => (
                  <span style={{ color: '#888', fontSize: 12 }}>{value}</span>
                )}
                wrapperStyle={{ paddingTop: 8 }}
              />
              <Bar dataKey="budget" name="Budget" fill={BUDGET_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent" fill={SPENT_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </ChartCard>
  );
};
