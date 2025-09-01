import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Dropdown,
  Spin,
  message,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { User, UserRole } from '../../types';
import { authService } from '../../services/authService';

const { Title, Text } = Typography;

const Users: React.FC = () => {
  const [usersData, setUsersData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const users = await authService.getUsers();
      
      // Ensure users is an array
      if (Array.isArray(users)) {
        setUsersData(users);
      } else {
        console.warn('API returned non-array data:', users);
        // Use mock data as fallback while debugging
        setUsersData([
          {
            id: '1',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@uadesigns.com',
            role: 'ADMIN' as any,
            isActive: true,
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@uadesigns.com',
            role: 'PROJECT_MANAGER' as any,
            isActive: true,
            avatar: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]);
        setError('Using mock data - check console for API response details');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      setUsersData([]); // Set empty array on error
      message.error(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.PROJECT_MANAGER:
        return 'blue';
      case UserRole.TEAM_LEAD:
        return 'green';
      case UserRole.CONTRACTOR:
        return 'orange';
      case UserRole.CLIENT:
        return 'purple';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (record: User) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div>
              {record.firstName} {record.lastName}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>
          {role.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: 'Edit User',
                icon: <EditOutlined />,
              },
              {
                key: 'delete',
                label: 'Delete User',
                icon: <DeleteOutlined />,
                danger: true,
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" style={{ color: '#009944' }} />
        <div style={{ color: '#ffffff', marginTop: '16px' }}>Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ color: '#ff4d4f', marginBottom: '16px' }}>Error: {error}</div>
        <Button type="primary" onClick={fetchUsers}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>User Management</Title>
        <Text type="secondary">Manage system users and their permissions</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="Users"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add User
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={Array.isArray(usersData) ? usersData : []}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} users`,
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="User Statistics">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#1890ff',
                    }}
                  >
                    {Array.isArray(usersData) ? usersData.length : 0}
                  </div>
                  <Text type="secondary">Total Users</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#009944',
                    }}
                  >
                    {Array.isArray(usersData) ? usersData.filter(u => u.isActive).length : 0}
                  </div>
                  <Text type="secondary">Active Users</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Role Distribution">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {Object.values(UserRole).map(role => {
                const count = Array.isArray(usersData) ? usersData.filter(u => u.role === role).length : 0;
                return (
                  <div
                    key={role}
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Text>{role.replace('_', ' ').toUpperCase()}</Text>
                    <Tag color={getRoleColor(role)}>{count}</Tag>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button type="default" icon={<PlusOutlined />} block>
                Invite New User
              </Button>
              <Button type="default" icon={<UserOutlined />} block>
                Bulk Import Users
              </Button>
              <Button type="default" icon={<EditOutlined />} block>
                Manage Permissions
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Users;
