import React from 'react';
import { Tag } from 'antd';

interface AIConfidenceBadgeProps {
  confidence?: number | null;
}

const AIConfidenceBadge: React.FC<AIConfidenceBadgeProps> = ({ confidence }) => {
  const c = typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : null;
  if (c === null) {
    return <Tag color="default">AI conf: —</Tag>;
  }

  const color = c >= 0.7 ? 'green' : c >= 0.4 ? 'orange' : 'red';
  const pct = Math.round(c * 100);
  return <Tag color={color}>AI conf: {pct}%</Tag>;
};

export default AIConfidenceBadge;

