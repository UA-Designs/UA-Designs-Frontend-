import React from 'react';
import { Typography, Empty } from 'antd';
import type { ActivityItem } from '../../../types/analytics';
import { ChartCard } from './ChartCard';

const { Text } = Typography;

interface Props {
  activities: ActivityItem[];
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#22c55e',
  UPDATE: '#3b82f6',
  DELETE: '#ef4444',
  APPROVE: '#a78bfa',
  REJECT: '#f59e0b',
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action?.toUpperCase()] ?? '#6b7280';
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export const RecentActivityFeed: React.FC<Props> = ({ activities }) => {
  const items = activities.slice(0, 10);

  return (
    <ChartCard title="Recent Activity">
      {items.length === 0 ? (
        <Empty
          description={<Text style={{ color: '#555' }}>No recent activity</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        />
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom:
                  i < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getActionColor(item.action),
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ color: '#d1d5db', fontSize: 13, display: 'block' }}
                  ellipsis
                >
                  {item.description}
                </Text>
                <Text style={{ color: '#555', fontSize: 11 }}>
                  {item.userName} &middot; {formatTimestamp(item.timestamp)}
                </Text>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: getActionColor(item.action),
                  background: `${getActionColor(item.action)}22`,
                  borderRadius: 4,
                  padding: '2px 6px',
                }}
              >
                {item.action}
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
};
