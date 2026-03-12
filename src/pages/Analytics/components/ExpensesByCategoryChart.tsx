import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Empty, Typography } from 'antd';
import type { ExpensesByCategory, ExpenseCategory } from '../../../types/analytics';
import { ChartCard } from './ChartCard';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ChartErrorBoundary } from '../../../components/Charts/ChartErrorBoundary';

const { Text } = Typography;

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  MATERIAL: '#1e3a5f',
  LABOR: '#3b82f6',
  EQUIPMENT: '#e67e22',
  OVERHEAD: '#6b7280',
  SUBCONTRACTOR: '#14b8a6',
  PERMITS: '#f97316',
  OTHER: '#64748b',
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MATERIAL: 'Material',
  LABOR: 'Labor',
  EQUIPMENT: 'Equipment',
  OVERHEAD: 'Overhead',
  SUBCONTRACTOR: 'Subcontractor',
  PERMITS: 'Permits',
  OTHER: 'Other',
};

interface Props {
  expenses: ExpensesByCategory;
}

const safeNum = (n: unknown): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

const DarkTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: '#1f1f1f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '10px 14px',
      }}
    >
      <div style={{ color: p.fill, fontWeight: 600 }}>{p.name}</div>
      <div style={{ color: '#fff', fontSize: 13 }}>{p.percent}%</div>
      <div style={{ color: '#888', fontSize: 12 }}>{formatCurrency(p.amount)}</div>
    </div>
  );
};

/** Pie chart: Expenses by Category with percentage labels on slices (e.g. Material: 95%) */
export const ExpensesByCategoryChart: React.FC<Props> = ({ expenses }) => {
  const total = (Object.values(expenses ?? {}) as number[]).reduce((a, b) => a + safeNum(b), 0);
  const chartData = (Object.entries(expenses ?? {}) as [ExpenseCategory, number][])
    .map(([cat, amount]) => ({ cat, amount: safeNum(amount) }))
    .filter(({ amount }) => amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(({ cat, amount }) => ({
      name: CATEGORY_LABELS[cat],
      amount,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      fill: CATEGORY_COLORS[cat],
    }));

  return (
    <ChartCard title="Expenses by Category">
      {chartData.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No expense data yet</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <ChartErrorBoundary height={320}>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                cx="50%"
                cy="50%"
                outerRadius={120}
                paddingAngle={2}
                label={({ name, percent }: any) => `${name}: ${typeof percent === 'number' && percent <= 1 ? Math.round(percent * 100) : percent}%`}
                labelLine={{ stroke: '#555', strokeWidth: 1 }}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </ChartCard>
  );
};
