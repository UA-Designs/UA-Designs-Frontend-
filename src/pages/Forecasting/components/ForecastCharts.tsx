import React from 'react';
import { Empty, Typography } from 'antd';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartErrorBoundary } from '../../../components/Charts/ChartErrorBoundary';
import { ChartCard } from '../../Analytics/components/ChartCard';
import { formatCurrency, formatCurrencyShort } from '../../../utils/formatCurrency';
import { getSafeDomain } from '../../../utils/chartUtils';
import type {
  CostChartPoint,
  ForecastHistorySnapshot,
  ProgressChartPoint,
  ScheduleChartData,
} from '../../../services/forecastService';
import { fmtDate, safeChartNum } from '../forecastFormat';

const { Text } = Typography;

const tooltipStyle: React.CSSProperties = {
  background: '#1f1f1f',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '10px 14px',
};

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 12 }}>
          {p.name}: {p.value == null ? 'n/a' : p.unit === 'php' ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const axisTick = { fill: '#666', fontSize: 11 };

export const CostTimelineChart: React.FC<{ data: CostChartPoint[] }> = ({ data }) => {
  const chartData = (data || [])
    .filter(d => d.date)
    .map(d => ({
      date: fmtDate(d.date) === 'n/a' ? d.date : fmtDate(d.date),
      actual: safeChartNum(d.actual),
      forecast: safeChartNum(d.forecast),
      budget: safeChartNum(d.budget),
    }));
  const yDomain = getSafeDomain(
    chartData.flatMap(d => [d.actual, d.forecast, d.budget]).filter((n): n is number => n != null),
    0,
    1
  );

  return (
    <ChartCard title="Cost timeline" subtitle="Actual vs forecast vs budget">
      {chartData.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No cost chart data</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '32px 0' }}
        />
      ) : (
        <ChartErrorBoundary height={240}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis
                domain={yDomain}
                tick={axisTick}
                tickFormatter={v => formatCurrencyShort(Number.isFinite(Number(v)) ? Number(v) : 0)}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />
              <Line type="monotone" dataKey="budget" name="Budget" stroke="#888" strokeDasharray="4 4" dot={false} unit="php" connectNulls />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#00cc66" strokeWidth={2} dot={false} unit="php" connectNulls />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#ffaa00" strokeWidth={2} dot={false} unit="php" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </ChartCard>
  );
};

export const ScheduleCompareChart: React.FC<{ data: ScheduleChartData | null }> = ({ data }) => {
  if (!data || (!data.baselineCompletion && !data.forecastCompletion && data.delayDays == null)) {
    return (
      <ChartCard title="Schedule" subtitle="Baseline vs forecast completion">
        <Empty
          description={<Text style={{ color: '#555' }}>No schedule chart data</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '32px 0' }}
        />
      </ChartCard>
    );
  }

  const delay = safeChartNum(data.delayDays) ?? 0;
  const chartData = [
    { name: 'Baseline', delay: 0 },
    { name: 'Forecast', delay },
  ];

  return (
    <ChartCard
      title="Schedule"
      subtitle={`${fmtDate(data.baselineCompletion)} → ${fmtDate(data.forecastCompletion)}${
        data.delayDays != null && Number.isFinite(data.delayDays)
          ? ` · ${data.delayDays} day delay`
          : ''
      }`}
    >
      <ChartErrorBoundary height={220}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="delay" name="Delay (days)" fill="#ffaa00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartErrorBoundary>
    </ChartCard>
  );
};

export const ProgressTimelineChart: React.FC<{ data: ProgressChartPoint[] }> = ({ data }) => {
  const chartData = (data || [])
    .filter(d => d.date)
    .map(d => ({
      date: fmtDate(d.date) === 'n/a' ? d.date : fmtDate(d.date),
      planned: safeChartNum(d.planned),
      actual: safeChartNum(d.actual),
      forecast: safeChartNum(d.forecast),
    }));
  const yDomain = getSafeDomain(
    chartData.flatMap(d => [d.planned, d.actual, d.forecast]).filter((n): n is number => n != null),
    0,
    100
  );

  return (
    <ChartCard title="Progress" subtitle="Planned vs actual vs forecast">
      {chartData.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No progress chart data</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '32px 0' }}
        />
      ) : (
        <ChartErrorBoundary height={240}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis domain={yDomain} tick={axisTick} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />
              <Area type="monotone" dataKey="planned" name="Planned" stroke="#888" fill="rgba(136,136,136,0.12)" connectNulls />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#00cc66" fill="rgba(0,204,102,0.12)" connectNulls />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#ffaa00" fill="rgba(255,170,0,0.12)" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </ChartCard>
  );
};

export const ForecastTrendChart: React.FC<{ snapshots: ForecastHistorySnapshot[] }> = ({
  snapshots,
}) => {
  const chartData = (snapshots || [])
    .map(s => ({
      date: fmtDate(s.forecastDate),
      cost: safeChartNum(s.costForecastValue),
      progress: safeChartNum(s.progressForecastValue),
    }))
    .filter(d => d.date !== 'n/a');

  const costDomain = getSafeDomain(
    chartData.map(d => d.cost).filter((n): n is number => n != null),
    0,
    1
  );

  return (
    <ChartCard title="Forecast trend" subtitle="Saved snapshots over time">
      {chartData.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No forecast history yet</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '32px 0' }}
        />
      ) : (
        <ChartErrorBoundary height={240}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="cost"
                domain={costDomain}
                tick={axisTick}
                tickFormatter={v => formatCurrencyShort(Number.isFinite(Number(v)) ? Number(v) : 0)}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <YAxis
                yAxisId="progress"
                orientation="right"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ color: '#aaa', fontSize: 12 }} />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                name="Cost forecast"
                stroke="#ffaa00"
                strokeWidth={2}
                dot={{ r: 3 }}
                unit="php"
                connectNulls
              />
              <Line
                yAxisId="progress"
                type="monotone"
                dataKey="progress"
                name="Progress forecast"
                stroke="#00aaff"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      )}
    </ChartCard>
  );
};
