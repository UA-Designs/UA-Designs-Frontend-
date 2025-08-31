import React from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { User, UserRole } from '../../types';

const { Title, Text } = Typography;

const Users: React.FC = () => {
  // Mock users data
  const usersData: User[] = [
    {
      id: '1',
      email: 'john.doe@uadesigns.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.PROJECT_MANAGER,
      avatar: '',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      email: 'jane.smith@uadesigns.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.TEAM_LEAD,
      avatar: '',
      isActive: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: '3',
      email: 'mike.johnson@uadesigns.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: UserRole.CONTRACTOR,
      avatar: '',
      isActive: false,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
  ];

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
              dataSource={usersData}
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
                    {usersData.length}
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
                      color: '#52c41a',
                    }}
                  >
                    {usersData.filter(u => u.isActive).length}
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
                const count = usersData.filter(u => u.role === role).length;
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
