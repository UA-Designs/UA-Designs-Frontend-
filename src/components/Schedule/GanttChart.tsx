import React, { useMemo } from 'react';
import { Empty, Typography, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
  riskDelayDays?: number;
  estimatedFinishDate?: string;
  adjustedFinishDate?: string;
  taskRiskDelayMap?: Record<string, number>;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.COMPLETED]: '#52c41a',
  [TaskStatus.IN_PROGRESS]: '#1890ff',
  [TaskStatus.NOT_STARTED]: '#595959',
  [TaskStatus.ON_HOLD]: '#faad14',
  [TaskStatus.CANCELLED]: '#ff4d4f',
};

const PLANNED_BAR = '#00aaff';
const ACTUAL_BAR = '#faad14';

const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  dependencies = [],
  riskDelayDays = 0,
  estimatedFinishDate,
  adjustedFinishDate,
  taskRiskDelayMap = {},
}) => {
  const chartData = useMemo(() => {
    if (!tasks.length) return [];

    // Find the earliest start date across all tasks (planned/actual) to use as baseline
    const validTasks = tasks.filter(t => t.startDate);
    if (!validTasks.length) return [];

    const mapped = validTasks
      .map(task => {
        const start = dayjs(task.startDate);
        const plannedEnd = task.endDate ? dayjs(task.endDate) : start.add(task.duration ?? 1, 'day');

        const actualStartRaw = (task as any).actualStartDate ?? (task as any).actual_start_date;
        const actualEndRaw =
          (task as any).completedAt ??
          (task as any).completed_at ??
          (task as any).actualEndDate ??
          (task as any).actual_end_date;

        const taskRiskDelayDays = Number(taskRiskDelayMap[task.id] ?? 0);

        const actualStart = actualStartRaw ? dayjs(actualStartRaw) : start;
        const actualEnd = actualEndRaw
          ? dayjs(actualEndRaw)
          : plannedEnd.add(taskRiskDelayDays > 0 ? taskRiskDelayDays : 0, 'day');

        const completedDateRaw =
          (task as any).completedAt ??
          (task as any).completed_at ??
          (task as any).actualEndDate ??
          (task as any).actual_end_date ??
          undefined;
        const completedDate = completedDateRaw ? dayjs(completedDateRaw) : null;
        const completionLabel = completedDate?.isValid()
          ? completedDate.format('MMM DD, YYYY')
          : (task.status === TaskStatus.COMPLETED ? actualEnd.format('MMM DD, YYYY') : null);

        return {
          id: task.id,
          name: task.name.length > 25 ? task.name.slice(0, 22) + '...' : task.name,
          plannedStart: start,
          plannedEnd,
          actualStart: actualStart.isValid() ? actualStart : start,
          actualEnd: actualEnd.isValid() ? actualEnd : plannedEnd,
          status: task.status,
          progress: safeNum(task.progress),
          plannedStartLabel: start.format('MMM DD'),
          plannedEndLabel: plannedEnd.format('MMM DD'),
          actualStartLabel: (actualStart.isValid() ? actualStart : start).format('MMM DD'),
          actualEndLabel: (actualEnd.isValid() ? actualEnd : plannedEnd).format('MMM DD'),
          durationDays: Math.max(1, safeNum((actualEnd.isValid() ? actualEnd : plannedEnd).diff(actualStart.isValid() ? actualStart : start, 'day') || 1)),
          completionLabel,
          taskRiskDelayDays,
        };
      })
      .filter((x) => x.plannedStart.isValid() && x.plannedEnd.isValid());

    if (!mapped.length) return [];

    const minDate = mapped.reduce((min, t) => (t.actualStart.isBefore(min) ? t.actualStart : min), mapped[0].plannedStart);

    return mapped
      .map((task) => {
        const plannedOffset = task.plannedStart.diff(minDate, 'day');
        const plannedDuration = task.plannedEnd.diff(task.plannedStart, 'day') || 1;
        const actualOffset = task.actualStart.diff(minDate, 'day');
        const actualDuration = task.actualEnd.diff(task.actualStart, 'day') || 1;
        return {
          ...task,
          plannedOffset: safeNum(plannedOffset),
          plannedDuration: Math.max(1, safeNum(plannedDuration)),
          actualOffset: safeNum(actualOffset),
          actualDuration: Math.max(1, safeNum(actualDuration)),
        };
      })
      .sort((a, b) => a.plannedOffset - b.plannedOffset);
  }, [tasks, taskRiskDelayMap]);

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

  const xValues = chartData.flatMap((d) => [
    d.plannedOffset,
    d.plannedOffset + d.plannedDuration,
    d.actualOffset,
    d.actualOffset + d.actualDuration,
  ]);
  const xDomain = getSafeDomain(xValues, 0, 1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      if (!d) return null;
      return (
        <div style={{ background: '#1f1f1f', border: '1px solid #333', padding: 12, borderRadius: 6 }}>
          <Text strong style={{ color: '#fff' }}>{d.name}</Text>
          <br />
          <Text style={{ color: '#91d5ff', fontSize: 12 }}>Planned: {d.plannedStartLabel} → {d.plannedEndLabel}</Text>
          <br />
          <Text style={{ color: '#ffd591', fontSize: 12 }}>Actual: {d.actualStartLabel} → {d.actualEndLabel}</Text>
          <br />
          <Tag color={STATUS_COLORS[d.status as TaskStatus]} style={{ marginTop: 4 }}>
            {d.status?.replace('_', ' ')}
          </Tag>
          <br />
          <Text style={{ color: '#aaa', fontSize: 12 }}>Progress: {d.progress}%</Text>
          {(d.status === TaskStatus.COMPLETED || d.completionLabel) && (
            <>
              <br />
              <Text style={{ color: '#aaa', fontSize: 12 }}>
                Done: {d.completionLabel || 'Yes'} ({d.durationDays} day{d.durationDays !== 1 ? 's' : ''})
              </Text>
            </>
          )}
          {d.taskRiskDelayDays > 0 && (
            <>
              <br />
              <Text style={{ color: '#faad14', fontSize: 12 }}>
                Risk delay on task: +{d.taskRiskDelayDays} day{d.taskRiskDelayDays !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {(estimatedFinishDate || adjustedFinishDate) && (
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: '#aaa', fontSize: 12 }}>
            Estimated finish: <strong style={{ color: '#fff' }}>{estimatedFinishDate || '—'}</strong>
            {riskDelayDays > 0 && (
              <>
                {' '}| Risk-adjusted finish: <strong style={{ color: '#ff4d4f' }}>{adjustedFinishDate || '—'}</strong>
                {' '}(+{riskDelayDays} day{riskDelayDays !== 1 ? 's' : ''})
              </>
            )}
          </Text>
        </div>
      )}
      <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: PLANNED_BAR }} />
          <Text style={{ fontSize: 12, color: '#aaa' }}>Planned</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: ACTUAL_BAR }} />
          <Text style={{ fontSize: 12, color: '#aaa' }}>Actual</Text>
        </div>
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
          <Legend />
          {/* Planned line (offset + duration) */}
          <Bar dataKey="plannedOffset" stackId="planned" fill="transparent" isAnimationActive={false} name="Planned (offset)" legendType="none" />
          <Bar dataKey="plannedDuration" stackId="planned" fill={PLANNED_BAR} radius={[2, 2, 2, 2]} isAnimationActive={false} name="Planned" />
          {/* Actual line (offset + duration) */}
          <Bar dataKey="actualOffset" stackId="actual" fill="transparent" isAnimationActive={false} name="Actual (offset)" legendType="none" />
          <Bar dataKey="actualDuration" stackId="actual" fill={ACTUAL_BAR} radius={[2, 2, 2, 2]} isAnimationActive={false} name="Actual" />
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
