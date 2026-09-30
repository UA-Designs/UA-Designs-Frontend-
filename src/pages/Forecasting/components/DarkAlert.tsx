import React from 'react';
import { Alert } from 'antd';
import type { AlertProps } from 'antd';
import '../forecasting.css';

type DarkAlertType = 'warning' | 'info' | 'error';

interface DarkAlertProps extends Omit<AlertProps, 'type'> {
  type?: DarkAlertType;
}

const DarkAlert: React.FC<DarkAlertProps> = ({
  type = 'info',
  className,
  ...props
}) => (
  <Alert
    {...props}
    type={type}
    className={['ua-forecast-alert', `ua-forecast-alert--${type}`, className]
      .filter(Boolean)
      .join(' ')}
  />
);

export default DarkAlert;
