import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

const colorMap = {
  blue:   { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa',  value: '#93c5fd' },
  green:  { bg: 'rgba(0,153,68,0.15)',    text: '#00cc66',  value: '#00ff88' },
  amber:  { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24',  value: '#fde68a' },
  purple: { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa',  value: '#c4b5fd' },
  red:    { bg: 'rgba(239,68,68,0.15)',   text: '#f87171',  value: '#fca5a5' },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  color = 'green',
}) => {
  const c = colorMap[color];
  return (
    <Card
      style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Text style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
            {label}
          </Text>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.value, lineHeight: 1.1, marginBottom: 4 }}>
            {value}
          </div>
          {subtitle && (
            <Text style={{ color: '#666', fontSize: 12 }}>{subtitle}</Text>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: c.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: c.text,
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};
