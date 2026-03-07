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
import { RecentActivity, ActivityType, UserRole } from '../../types';
import { dashboardService } from '../../services/dashboardService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

const RecentActivities: React.FC = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await dashboardService.getRecentActivities(10);
        
        // Transform API data to match component expectations
        const transformedData: RecentActivity[] = data.map((activity: any) => ({
          id: activity.id?.toString() || Math.random().toString(),
          type: activity.type || ActivityType.PROJECT_CREATED,
          description: activity.description || activity.message || 'Activity',
          user: activity.user || {
            id: activity.userId || 'unknown',
            firstName: activity.userName ? activity.userName.split(' ')[0] : 'Unknown',
            lastName: activity.userName ? (activity.userName.split(' ').slice(1).join(' ') || '') : 'User',
            email: activity.userEmail || '',
            role: UserRole.STAFF,
            avatar: undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          createdAt: activity.createdAt || activity.timestamp || new Date().toISOString(),
        }));
        
        setActivities(transformedData);
      } catch (error) {
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
              role: UserRole.PROJECT_MANAGER,
              isActive: true,
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
              role: UserRole.ENGINEER,
              isActive: true,
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
              role: UserRole.PROJECT_MANAGER,
              isActive: true,
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
        <Spin size="large" style={{ color: '#009944' }} />
        <div style={{ color: '#ffffff', marginTop: '16px' }}>Loading recent activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            background: '#009944',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
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
                  by {activity.user?.firstName || 'Unknown'} {activity.user?.lastName || 'User'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {activity.createdAt ? dayjs(activity.createdAt).fromNow() : 'Just now'}
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
