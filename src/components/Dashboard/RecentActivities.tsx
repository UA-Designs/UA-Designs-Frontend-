import React, { useEffect, useState } from 'react';
import { List, Avatar, Typography, Tag, Empty, Spin } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  CommentOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { RecentActivity, ActivityType } from '../../types';
import { dashboardService } from '../../services/dashboardService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await dashboardService.getRecentActivities(10);
        setActivities(data);
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.PROJECT_CREATED:
      case ActivityType.PROJECT_UPDATED:
        return <ProjectOutlined style={{ color: '#1890ff' }} />;
      case ActivityType.TASK_CREATED:
      case ActivityType.TASK_COMPLETED:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case ActivityType.USER_JOINED:
        return <UserOutlined style={{ color: '#722ed1' }} />;
      case ActivityType.DOCUMENT_UPLOADED:
        return <UploadOutlined style={{ color: '#fa8c16' }} />;
      case ActivityType.COMMENT_ADDED:
        return <CommentOutlined style={{ color: '#13c2c2' }} />;
      default:
        return <FileTextOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.PROJECT_CREATED:
      case ActivityType.TASK_CREATED:
      case ActivityType.USER_JOINED:
        return 'success';
      case ActivityType.PROJECT_UPDATED:
      case ActivityType.TASK_COMPLETED:
        return 'processing';
      case ActivityType.DOCUMENT_UPLOADED:
        return 'warning';
      case ActivityType.COMMENT_ADDED:
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Empty
        description="No recent activities"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <List
      dataSource={activities}
      renderItem={activity => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar
                icon={getActivityIcon(activity.type)}
                style={{ backgroundColor: 'transparent' }}
              />
            }
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong>{activity.description}</Text>
                <Tag color={getActivityColor(activity.type)}>
                  {activity.type.replace('_', ' ').toLowerCase()}
                </Tag>
              </div>
            }
            description={
              <div>
                <Text type="secondary">
                  by {activity.user.firstName} {activity.user.lastName}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {dayjs(activity.createdAt).fromNow()}
                </Text>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
};

export default RecentActivities;
