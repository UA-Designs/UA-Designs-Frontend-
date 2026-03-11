import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Empty, Typography } from 'antd';
import type { MonthlySpendingPoint } from '../../../types/analytics';
import { ChartCard } from './ChartCard';
import { formatCurrency, formatCurrencyShort } from '../../../utils/formatCurrency';

const { Text } = Typography;

interface Props {
  data: MonthlySpendingPoint[];
}

/** "2025-03"  →  "Mar 25" */
function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

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
      <div style={{ color: '#60a5fa', fontWeight: 600 }}>{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

/** Ensure value is a finite number for Recharts (avoids DecimalError: NaN) */
const safeNum = (n: unknown): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

export const MonthlySpendingChart: React.FC<Props> = ({ data }) => {
  const chartData = (data ?? []).map((d) => ({
    month: formatMonthLabel(d.month),
    amount: safeNum(d.amount),
  }));

  return (
    <ChartCard title="Monthly Spending Trend" subtitle="Last 6 months">
      {chartData.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No spending data yet</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '40px 0' }}
        />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#666', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 'auto']}
              tick={{ fill: '#666', fontSize: 11 }}
              tickFormatter={(v) => formatCurrencyShort(Number.isFinite(Number(v)) ? v : 0)}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip content={<DarkTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#spendingGrad)"
              dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
              activeDot={{ fill: '#60a5fa', r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
};
