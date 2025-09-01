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
  // Use mock data if no data provided or data is invalid
  const chartData = data && Array.isArray(data) && data.length > 0 ? data.map(item => ({
    name: item.projectName || 'Unnamed Project',
    planned: item.plannedCost || 0,
    actual: item.actualCost || 0,
    variance: item.variance || 0,
  })) : [
    { name: 'Project A', planned: 100000, actual: 95000, variance: -5 },
    { name: 'Project B', planned: 150000, actual: 160000, variance: 6.7 },
    { name: 'Project C', planned: 200000, actual: 180000, variance: -10 },
    { name: 'Project D', planned: 120000, actual: 125000, variance: 4.2 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#b3b3b3' }}
          angle={-45}
          textAnchor="end"
          height={60}
          axisLine={{ stroke: '#333' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#b3b3b3' }} 
          axisLine={{ stroke: '#333' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
          }}
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
          stroke="#009944"
          strokeWidth={2}
          dot={{ fill: '#009944', strokeWidth: 2, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#ff4d4f"
          strokeWidth={2}
          dot={{ fill: '#ff4d4f', strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CostVarianceChart;
