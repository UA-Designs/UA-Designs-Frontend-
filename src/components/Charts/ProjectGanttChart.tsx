import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ProjectProgress } from '../../types';

interface ProjectGanttChartProps {
  data: ProjectProgress[];
}

const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    name:
      item.projectName.length > 15
        ? item.projectName.substring(0, 15) + '...'
        : item.projectName,
    progress: item.progress,
    status: item.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          width={120}
        />
        <Tooltip
          formatter={value => [`${value}%`, 'Progress']}
          labelFormatter={label => `Project: ${label}`}
        />
        <Bar dataKey="progress" fill="#1890ff" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectGanttChart;
