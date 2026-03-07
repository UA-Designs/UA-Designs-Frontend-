import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Typography } from 'antd';
import type { ProjectBudget } from '../../../types/analytics';
import { ChartCard } from './ChartCard';
import { formatCurrency } from '../../../utils/formatCurrency';

const { Text } = Typography;

interface Props {
  budget: ProjectBudget;
}

interface BudgetRowProps {
  label: string;
  value: number;
  valueColor?: string;
}

const BudgetRow: React.FC<BudgetRowProps> = ({ label, value, valueColor = '#d1d5db' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <Text style={{ color: '#888', fontSize: 13 }}>{label}</Text>
    <Text style={{ color: valueColor, fontSize: 13, fontWeight: 600 }}>{formatCurrency(value)}</Text>
  </div>
);

export const BudgetGauge: React.FC<Props> = ({ budget }) => {
  const pct = Math.min(budget.utilization, 100);
  const remaining = Math.max(100 - pct, 0);

  let ringColor = '#22c55e'; // green < 75%
  if (budget.isOverBudget) ringColor = '#ef4444'; // red > 100%
  else if (pct >= 75) ringColor = '#f59e0b';       // amber 75–100%

  const gaugeData = [
    { value: pct, fill: ringColor },
    { value: remaining, fill: 'rgba(255,255,255,0.06)' },
  ];

  return (
    <ChartCard title="Budget Overview">
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Donut ring */}
        <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={gaugeData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={66}
                startAngle={90}
                endAngle={-270}
                paddingAngle={1}
                strokeWidth={0}
              >
                {gaugeData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: ringColor, lineHeight: 1 }}>
              {budget.utilization.toFixed(0)}%
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>used</div>
            {budget.isOverBudget && (
              <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginTop: 1 }}>
                OVER
              </div>
            )}
          </div>
        </div>

        {/* Breakdown rows */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <BudgetRow label="Total Budget"  value={budget.totalBudget} />
          <BudgetRow label="Spent"         value={budget.totalSpent}   valueColor={ringColor} />
          <BudgetRow label="Pending"       value={budget.totalPending} valueColor="#f59e0b" />
          <BudgetRow
            label="Remaining"
            value={budget.remaining}
            valueColor={budget.isOverBudget ? '#ef4444' : '#22c55e'}
          />
        </div>
      </div>
    </ChartCard>
  );
};
