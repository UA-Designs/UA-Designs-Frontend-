import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CostVariance } from '../../types';

interface CostVarianceChartProps {
  data: CostVariance[];
}

const CostVarianceChart: React.FC<CostVarianceChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.projectName,
    planned: item.plannedCost,
    actual: item.actualCost,
    variance: item.variance,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => [
            `$${Number(value).toLocaleString()}`,
            name === 'planned'
              ? 'Planned Cost'
              : name === 'actual'
                ? 'Actual Cost'
                : 'Variance',
          ]}
        />
        <Line
          type="monotone"
          dataKey="planned"
          stroke="#1890ff"
          strokeWidth={2}
          dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#52c41a"
          strokeWidth={2}
          dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CostVarianceChart;
