import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Empty, Typography } from 'antd';
import type { TaskDistribution, TaskStatus } from '../../../types/analytics';
import { ChartCard } from './ChartCard';

const { Text } = Typography;

const safeNum = (n: unknown): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

const TASK_COLORS: Record<TaskStatus, string> = {
  NOT_STARTED: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  ON_HOLD: '#f59e0b',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};

const TASK_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface Props {
  distribution: TaskDistribution;
}

const DarkTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '10px 14px',
      }}
    >
      <div style={{ color: payload[0].payload.fill, fontWeight: 600 }}>{payload[0].name}</div>
      <div style={{ color: '#fff', fontSize: 13 }}>{payload[0].value} tasks</div>
    </div>
  );
};

export const TaskDistributionChart: React.FC<Props> = ({ distribution }) => {
  const chartData = (Object.entries(distribution ?? {}) as [TaskStatus, number][])
    .map(([status, count]) => ({ status, value: safeNum(count) }))
    .filter(({ value }) => value > 0)
    .map(({ status, value }) => ({
      name: TASK_LABELS[status],
      value,
      fill: TASK_COLORS[status],
    }));

  const total = chartData.reduce((a, b) => a + b.value, 0);

  return (
    <ChartCard title="Task Distribution">
      {chartData.length === 0 || total === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No task data yet</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <div style={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: '#aaa', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Total</div>
          </div>
        </div>
      )}
    </ChartCard>
  );
};
