import React from 'react';
import { Tag } from 'antd';
import {
  forecastStatusColor,
  forecastStatusLabel,
} from '../forecastFormat';

interface ForecastStatusBadgeProps {
  status?: string | null;
}

const COLOR_MAP: Record<string, string> = {
  success: 'green',
  warning: 'gold',
  error: 'red',
  default: 'default',
};

const ForecastStatusBadge: React.FC<ForecastStatusBadgeProps> = ({ status }) => {
  if (!status) {
    return <Tag>n/a</Tag>;
  }
  const tone = forecastStatusColor(status);
  return <Tag color={COLOR_MAP[tone]}>{forecastStatusLabel(status)}</Tag>;
};

export default ForecastStatusBadge;
