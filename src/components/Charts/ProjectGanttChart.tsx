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
  // Use mock data if no data provided or data is invalid
  const chartData = data && Array.isArray(data) && data.length > 0 ? data.map(item => ({
    name: item.projectName && item.projectName.length > 15
      ? item.projectName.substring(0, 15) + '...'
      : item.projectName || 'Unnamed Project',
    progress: item.progress || 0,
    status: item.status || 'Unknown',
  })) : [
    { name: 'Website Redesign', progress: 75, status: 'In Progress' },
    { name: 'Mobile App', progress: 45, status: 'In Progress' },
    { name: 'Database Migration', progress: 100, status: 'Completed' },
    { name: 'API Development', progress: 30, status: 'In Progress' },
    { name: 'Testing Phase', progress: 0, status: 'Not Started' },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          type="number" 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: '#b3b3b3' }}
          axisLine={{ stroke: '#333' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: '#b3b3b3' }}
          width={120}
          axisLine={{ stroke: '#333' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#fff',
          }}
          formatter={value => [`${value}%`, 'Progress']}
          labelFormatter={label => `Project: ${label}`}
        />
        <Bar 
          dataKey="progress" 
          fill="#009944" 
          radius={[0, 4, 4, 0]}
          stroke="#00aa55"
          strokeWidth={1}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectGanttChart;
