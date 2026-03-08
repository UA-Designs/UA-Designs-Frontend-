import React from 'react';
import { Button, Space, Typography } from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      key: 'new-project',
      icon: <PlusOutlined />,
      label: 'New Project',
      onClick: () => navigate('/projects', { state: { openCreate: true } }),
      color: '#1890ff',
    },
    {
      key: 'add-task',
      icon: <CalendarOutlined />,
      label: 'Add Task',
      onClick: () => navigate('/pmbok/schedule'),
      color: '#009944',
    },
    {
      key: 'add-team',
      icon: <TeamOutlined />,
      label: 'Add Team Member',
      onClick: () => navigate('/pmbok/resources'),
      color: '#722ed1',
    },
    {
      key: 'add-risk',
      icon: <ExclamationCircleOutlined />,
      label: 'Add Risk',
      onClick: () => navigate('/pmbok/risk'),
      color: '#fa8c16',
    },
    {
      key: 'add-cost',
      icon: <DollarOutlined />,
      label: 'Add Cost Item',
      onClick: () => navigate('/pmbok/cost'),
      color: '#eb2f96',
    },
    {
      key: 'generate-report',
      icon: <FileTextOutlined />,
      label: 'Generate Report',
      onClick: () => navigate('/reports'),
      color: '#13c2c2',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Text type="secondary" style={{ marginBottom: 12, display: 'block', fontSize: '12px' }}>
        Common actions to get started quickly
      </Text>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {actions.map(action => (
            <Button
              key={action.key}
              type="default"
              icon={action.icon}
              onClick={action.onClick}
              style={{
                width: '100%',
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderColor: action.color,
                color: action.color,
                fontSize: '13px',
                fontWeight: '500',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = action.color;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = action.color;
              }}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </div>
    </div>
  );
};

export default QuickActions;
