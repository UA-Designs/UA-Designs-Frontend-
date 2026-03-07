import React from 'react';
import { Typography, Tag, Progress } from 'antd';
import type { ProjectInfo } from '../../../types/analytics';

const { Title, Text } = Typography;

interface Props {
  project: ProjectInfo;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  ACTIVE:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    label: 'Active' },
  COMPLETED:  { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   label: 'Completed' },
  ON_HOLD:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   label: 'On Hold' },
  CANCELLED:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)',  label: 'Cancelled' },
  PLANNING:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  label: 'Planning' },
};

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

export const ProjectInfoHeader: React.FC<Props> = ({ project }) => {
  const statusKey = project.status?.toUpperCase().replace(/\s+/g, '_');
  const statusCfg = STATUS_CONFIG[statusKey] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', label: project.status };

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '24px',
        marginBottom: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <Title level={3} style={{ margin: 0, color: '#fff' }}>
          {project.name}
        </Title>
        <Tag
          style={{
            border: 'none',
            borderRadius: 6,
            background: statusCfg.bg,
            color: statusCfg.color,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {statusCfg.label}
        </Tag>
        {project.isOverdue && (
          <Tag
            style={{
              border: 'none',
              borderRadius: 6,
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            OVERDUE
          </Tag>
        )}
      </div>

      <Text style={{ color: '#888', fontSize: 13 }}>
        {formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}
        &nbsp;&middot;&nbsp;
        {project.isOverdue ? (
          <span style={{ color: '#ef4444' }}>Overdue</span>
        ) : (
          <span>{project.daysRemaining} days remaining</span>
        )}
      </Text>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#666', fontSize: 12 }}>Overall Progress</Text>
          <Text style={{ color: '#aaa', fontSize: 12, fontWeight: 600 }}>{project.progress.toFixed(0)}%</Text>
        </div>
        <Progress
          percent={project.progress}
          showInfo={false}
          strokeColor={project.isOverdue ? '#ef4444' : '#3b82f6'}
          trailColor="rgba(255,255,255,0.08)"
          strokeWidth={8}
        />
      </div>
    </div>
  );
};
