import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Empty, Typography } from 'antd';
import type { ExpensesByCategory, ExpenseCategory } from '../../../types/analytics';
import { ChartCard } from './ChartCard';
import { formatCurrency, formatCurrencyShort } from '../../../utils/formatCurrency';

const { Text } = Typography;

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  MATERIAL: '#f59e0b',
  LABOR: '#3b82f6',
  EQUIPMENT: '#8b5cf6',
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

/** Ensure value is a finite number for Recharts (avoids DecimalError: NaN) */
const safeNum = (n: unknown): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

const DarkTooltip = ({ active, payload, label }: any) => {
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
      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

export const ExpensesByCategoryChart: React.FC<Props> = ({ expenses }) => {
  const chartData = (Object.entries(expenses ?? {}) as [ExpenseCategory, number][])
    .map(([cat, amount]) => ({ cat, amount: safeNum(amount) }))
    .filter(({ amount }) => amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map(({ cat, amount }) => ({
      name: CATEGORY_LABELS[cat],
      amount,
      color: CATEGORY_COLORS[cat],
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
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 'auto']}
              tick={{ fill: '#666', fontSize: 11 }}
              tickFormatter={(v) => formatCurrencyShort(Number.isFinite(Number(v)) ? v : 0)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fill: '#aaa', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};
