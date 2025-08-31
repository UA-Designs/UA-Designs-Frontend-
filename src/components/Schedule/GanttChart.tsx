import React from 'react';
import { Typography, Empty } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Text } = Typography;

const GanttChart: React.FC = () => {
  // This is a placeholder for the actual Gantt chart implementation
  // In a real application, you would use a library like @dhtmlx/trial or react-gantt-timeline

  return (
    <div
      style={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Empty
        image={<CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
        description={
          <div>
            <Text type="secondary">Gantt Chart</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Interactive timeline view will be displayed here
            </Text>
          </div>
        }
      />
    </div>
  );
};

export default GanttChart;
