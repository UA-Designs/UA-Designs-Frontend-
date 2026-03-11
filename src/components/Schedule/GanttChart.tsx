import React, { useMemo } from 'react';
import { Empty, Typography, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartErrorBoundary } from '../Charts/ChartErrorBoundary';
import { getSafeDomain } from '../../utils/chartUtils';
import { ScheduleTask, TaskDependency, TaskStatus } from '../../services/scheduleService';
import dayjs from 'dayjs';

const { Text } = Typography;

const safeNum = (n: unknown): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

interface GanttChartProps {
  tasks: ScheduleTask[];
  dependencies?: TaskDependency[];
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.COMPLETED]: '#52c41a',
  [TaskStatus.IN_PROGRESS]: '#1890ff',
  [TaskStatus.NOT_STARTED]: '#595959',
  [TaskStatus.ON_HOLD]: '#faad14',
  [TaskStatus.CANCELLED]: '#ff4d4f',
};

const GanttChart: React.FC<GanttChartProps> = ({ tasks, dependencies = [] }) => {
  const chartData = useMemo(() => {
    if (!tasks.length) return [];

    // Find the earliest start date across all tasks to use as baseline
    const validTasks = tasks.filter(t => t.startDate);
    if (!validTasks.length) return [];

    const minDate = dayjs(
      validTasks.reduce((min, t) =>
        dayjs(t.startDate).isBefore(dayjs(min)) ? t.startDate! : min,
        validTasks[0].startDate!
      )
    );

    return validTasks
      .map(task => {
        const start = dayjs(task.startDate);
        const end = task.endDate ? dayjs(task.endDate) : start.add(task.duration ?? 1, 'day');
        const offset = start.diff(minDate, 'day');
        const duration = end.diff(start, 'day') || 1;

        return {
          id: task.id,
          name: task.name.length > 25 ? task.name.slice(0, 22) + '...' : task.name,
          offset: safeNum(offset),
          duration: Math.max(1, safeNum(duration)),
          status: task.status,
          progress: safeNum(task.progress),
          startLabel: start.format('MMM DD'),
          endLabel: end.format('MMM DD'),
        };
      })
      .sort((a, b) => a.offset - b.offset);
  }, [tasks]);

  if (!tasks.length) {
    return (
      <Empty description="No tasks available. Add tasks to see the Gantt chart." />
    );
  }

  if (!chartData.length) {
    return (
      <Empty description="Tasks have no start dates set. Add start and end dates to tasks to see the Gantt chart." />
    );
  }

  const xValues = chartData.flatMap((d) => [d.offset, d.offset + d.duration]);
  const xDomain = getSafeDomain(xValues, 0, 1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      if (!d) return null;
      return (
        <div style={{ background: '#1f1f1f', border: '1px solid #333', padding: 12, borderRadius: 6 }}>
          <Text strong style={{ color: '#fff' }}>{d.name}</Text>
          <br />
          <Text style={{ color: '#aaa', fontSize: 12 }}>{d.startLabel} → {d.endLabel}</Text>
          <br />
          <Tag color={STATUS_COLORS[d.status as TaskStatus]} style={{ marginTop: 4 }}>
            {d.status?.replace('_', ' ')}
          </Tag>
          <br />
          <Text style={{ color: '#aaa', fontSize: 12 }}>Progress: {d.progress}%</Text>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
            <Text style={{ fontSize: 12, color: '#aaa' }}>{status.replace('_', ' ')}</Text>
          </div>
        ))}
      </div>
      <ChartErrorBoundary height={Math.max(300, chartData.length * 40)}>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
          <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 8, right: 40, left: 120, bottom: 8 }}
          barCategoryGap="20%"
        >
          <XAxis
            type="number"
            domain={xDomain}
            tick={{ fill: '#888', fontSize: 11 }}
            label={{ value: 'Days from project start', position: 'insideBottom', offset: -4, fill: '#666', fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={115}
            tick={{ fill: '#ccc', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Transparent offset bar (pushes each task bar to its start position) */}
          <Bar dataKey="offset" stackId="gantt" fill="transparent" isAnimationActive={false} />
          {/* Actual duration bar */}
          <Bar dataKey="duration" stackId="gantt" radius={[2, 2, 2, 2]} isAnimationActive={false}>
            {chartData.map(entry => (
              <Cell key={entry.id} fill={STATUS_COLORS[entry.status] || '#595959'} />
            ))}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
        {dependencies.length > 0 && (
          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
            {dependencies.length} task {dependencies.length === 1 ? 'dependency' : 'dependencies'} defined (arrows not shown in bar chart view)
          </Text>
        )}
      </ChartErrorBoundary>
    </div>
  );
};

export default GanttChart;
