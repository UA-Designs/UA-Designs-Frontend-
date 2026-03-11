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
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Statistic,
  InputNumber,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { User, UserRole } from '../../types';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: UserRole.PROPRIETOR,      label: 'Proprietor',       color: 'magenta' },
  { value: UserRole.ADMIN,           label: 'Admin',            color: 'red'     },
  { value: UserRole.PROJECT_MANAGER, label: 'Project Manager',  color: 'blue'    },
  { value: UserRole.ARCHITECT,       label: 'Architect',        color: 'purple'  },
  { value: UserRole.ENGINEER,        label: 'Engineer',         color: 'green'   },
  { value: UserRole.STAFF,           label: 'Staff',            color: 'default' },
];

const roleColor = (role: string) =>
  ROLES.find(r => r.value === role)?.color ?? 'default';

const Users: React.FC = () => {
  const { user: currentUser, can } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const canManageUsers = can('ENGINEER_AND_ABOVE');

  const [usersData, setUsersData]   = useState<User[]>([]);
  const [stats, setStats]           = useState<any>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // User create/edit modal
  const [userModalVisible, setUserModalVisible]   = useState(false);
  const [editingUser, setEditingUser]             = useState<User | null>(null);
  const [userModalLoading, setUserModalLoading]   = useState(false);
  const [userForm] = Form.useForm();

  // Permissions modal
  const [permModalVisible, setPermModalVisible]     = useState(false);
  const [permUser, setPermUser]                     = useState<User | null>(null);
  const [permLoading, setPermLoading]               = useState(false);
  const [permSaving, setPermSaving]                 = useState(false);
  const [permForm] = Form.useForm();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [usersResult, statsResult] = await Promise.allSettled([
        authService.getUsers(),
        authService.getUserStats(),
      ]);
      if (usersResult.status === 'fulfilled') setUsersData(usersResult.value);
      else message.error('Failed to load users');
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    } finally {
      setIsLoading(false);
    }
  };

  // ---- User CRUD ----

  const openAddModal = () => {
    setEditingUser(null);
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const openEditModal = async (record: User) => {
    setEditingUser(record);
    userForm.resetFields();
    userForm.setFieldsValue({
      firstName:  record.firstName,
      lastName:   record.lastName,
      email:      record.email,
      role:       record.role,
    });
    setUserModalVisible(true);
  };

  const handleUserSubmit = async () => {
    setUserModalLoading(true);
    try {
      const values = await userForm.validateFields();
      if (editingUser) {
        await authService.updateUser(editingUser.id, values);
        message.success('User updated');
      } else {
        await authService.createUser(values);
        message.success('User created');
      }
      setUserModalVisible(false);
      loadAll();
    } catch (error: any) {
      message.error(error.message || 'Failed to save user');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await authService.deleteUser(id);
      message.success('User deleted');
      loadAll();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (record: User) => {
    try {
      if (record.isActive) {
        await authService.deactivateUser(record.id);
        message.success(`${record.firstName} deactivated`);
      } else {
        await authService.activateUser(record.id);
        message.success(`${record.firstName} activated`);
      }
      loadAll();
    } catch (error: any) {
      message.error(error.message || 'Failed to update user status');
    }
  };

  // ---- Permissions ----

  const openPermModal = async (record: User) => {
    setPermUser(record);
    setPermModalVisible(true);
    setPermLoading(true);
    try {
      const perms = await authService.getUserPermissions(record.id);
      permForm.setFieldsValue({
        approvalLevel:   perms?.approvalLevel ?? 0,
        permissionsJson: JSON.stringify(perms?.permissions ?? perms ?? {}, null, 2),
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to load permissions');
    } finally {
      setPermLoading(false);
    }
  };

  const handlePermSave = async () => {
    if (!permUser) return;
    setPermSaving(true);
    try {
      const values = await permForm.validateFields();
      let parsed: Record<string, any> = {};
      try {
        parsed = JSON.parse(values.permissionsJson || '{}');
      } catch {
        message.error('Invalid JSON in permissions field');
        return;
      }
      await authService.updateUserPermissions(permUser.id, parsed, values.approvalLevel);
      message.success('Permissions updated');
      setPermModalVisible(false);
    } catch (error: any) {
      message.error(error.message || 'Failed to save permissions');
    } finally {
      setPermSaving(false);
    }
  };

  // ---- Table ----

  const buildActionMenu = (record: User) => ({
    items: [
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => openEditModal(record),
      },
      ...(canManageUsers ? [
        {
          key: 'toggle',
          label: record.isActive ? 'Deactivate' : 'Activate',
          icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
          onClick: () => handleToggleActive(record),
        },
        {
          key: 'permissions',
          label: 'Permissions',
          icon: <LockOutlined />,
          onClick: () => openPermModal(record),
        },
        {
          key: 'delete',
          label: 'Delete',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => {
            Modal.confirm({
              title: `Delete ${record.firstName} ${record.lastName}?`,
              content: 'This action cannot be undone.',
              okText: 'Delete',
              okType: 'danger',
              onOk: () => handleDelete(record.id),
            });
          },
        },
      ] : []),
    ],
  });

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#009944' }}>
            {record.firstName?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div>{record.firstName} {record.lastName}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColor(role)}>{role?.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Dropdown menu={buildActionMenu(record)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>User Management</Title>
        <Text type="secondary">Manage system users and their permissions</Text>
      </div>

      {/* Stats row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="Total Users" value={stats?.totalUsers ?? usersData.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats?.activeUsers ?? usersData.filter(u => u.isActive).length}
              valueStyle={{ color: '#009944' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        {ROLES.map(r => {
          const count = stats?.usersByRole?.[r.value] ?? usersData.filter(u => u.role === r.value).length;
          return (
            <Col xs={12} sm={3} key={r.value}>
              <Card size="small">
                <Statistic title={r.label} value={count} valueStyle={{ fontSize: 18 }} />
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card
        title="Users"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadAll}>Refresh</Button>
            {canManageUsers && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
                Add User
              </Button>
            )}
          </Space>
        }
      >
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={usersData}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: usersData.length,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            }}
          />
        </Spin>
      </Card>

      {/* Create / Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={userModalVisible}
        onOk={handleUserSubmit}
        onCancel={() => setUserModalVisible(false)}
        confirmLoading={userModalLoading}
        width={560}
      >
        <Form form={userForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              {ROLES.map(r => (
                <Option key={r.value} value={r.value}>{r.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeId" label="Employee ID"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="costCenter" label="Cost Center"><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="officeLocation" label="Office Location"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        title={permUser ? `Permissions — ${permUser.firstName} ${permUser.lastName}` : 'Permissions'}
        open={permModalVisible}
        onOk={handlePermSave}
        onCancel={() => setPermModalVisible(false)}
        confirmLoading={permSaving}
      >
        <Spin spinning={permLoading}>
          <Form form={permForm} layout="vertical">
            <Form.Item name="approvalLevel" label="Approval Level">
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="permissionsJson"
              label="Permissions (JSON)"
              extra="Edit the raw permissions JSON object for this user."
            >
              <Input.TextArea rows={8} style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default Users;

