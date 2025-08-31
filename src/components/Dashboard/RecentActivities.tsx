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
        console.warn('API not available, using mock data for recent activities:', error);
        // Use mock data if API fails
        setActivities([
          {
            id: '1',
            type: ActivityType.PROJECT_CREATED,
            description: 'Project "Website Redesign" has been created',
            user: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@uadesigns.com',
              role: 'project_manager',
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            type: ActivityType.TASK_COMPLETED,
            description: 'Task "Design Mockups" has been completed',
            user: {
              id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@uadesigns.com',
              role: 'team_lead',
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '3',
            type: ActivityType.COMMENT_ADDED,
            description: 'New comment on "Project Planning"',
            user: {
              id: '1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@uadesigns.com',
              role: 'project_manager',
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ]);
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
