import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, style }) => (
  <Card
    style={{
      background: '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      ...style,
    }}
    styles={{ body: { padding: '24px' } }}
  >
    <div style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#aaa',
          display: 'block',
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 11, color: '#555', display: 'block', marginTop: 2 }}>
          {subtitle}
        </Text>
      )}
    </div>
    {children}
  </Card>
);
