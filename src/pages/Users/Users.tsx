import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Dropdown,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  Drawer,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { User, UserRole } from '../../types';
import { userService } from '../../services/userService';

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.PROJECT_MANAGER, label: 'Project Manager' },
  { value: UserRole.CIVIL_ENGINEER, label: 'Civil Engineer' },
  { value: UserRole.ARCHITECT, label: 'Architect' },
  { value: UserRole.SITE_ENGINEER, label: 'Site Engineer' },
  { value: UserRole.JUNIOR_ARCHITECT, label: 'Junior Architect' },
  { value: UserRole.APPRENTICE_ARCHITECT, label: 'Apprentice Architect' },
  { value: UserRole.BOOKKEEPER, label: 'Bookkeeper' },
  { value: UserRole.SECRETARY, label: 'Secretary' },
  { value: UserRole.TEAM_LEAD, label: 'Team Lead' },
  { value: UserRole.CONTRACTOR, label: 'Contractor' },
  { value: UserRole.CLIENT, label: 'Client' },
  { value: UserRole.VIEWER, label: 'Viewer' },
];

const roleColors: Record<string, string> = {
  [UserRole.ADMIN]: 'red',
  [UserRole.PROJECT_MANAGER]: 'geekblue',
  [UserRole.CIVIL_ENGINEER]: 'volcano',
  [UserRole.ARCHITECT]: 'purple',
  [UserRole.SITE_ENGINEER]: 'cyan',
  [UserRole.JUNIOR_ARCHITECT]: 'blue',
  [UserRole.APPRENTICE_ARCHITECT]: 'gold',
  [UserRole.BOOKKEEPER]: 'green',
  [UserRole.SECRETARY]: 'lime',
  [UserRole.TEAM_LEAD]: 'geekblue',
  [UserRole.CONTRACTOR]: 'orange',
  [UserRole.CLIENT]: 'magenta',
  [UserRole.VIEWER]: 'default',
};

const statusColors = {
  active: 'green',
  inactive: 'red',
};

const formatRoleLabel = (role?: string) => role ? role.replace(/_/g, ' ').toUpperCase() : '—';

const Users: React.FC = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, roleBreakdown: {} as Record<string, number> });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: '', role: undefined as UserRole | undefined, department: '', isActive: undefined as boolean | undefined });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [sorter, setSorter] = useState({ sortBy: 'createdAt', sortOrder: 'desc' as 'asc' | 'desc' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await userService.getStats();
      setStats(response);
    } catch (error: any) {
      message.error(error.message || 'Failed to load user statistics');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.list({
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        role: filters.role,
        department: filters.department || undefined,
        isActive: filters.isActive,
        sortBy: sorter.sortBy,
        sortOrder: sorter.sortOrder,
      });

      setUsers(result.users);
      setPagination(prev => ({ ...prev, total: result.total, current: result.page, pageSize: result.limit }));
    } catch (error: any) {
      message.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters.department, filters.isActive, filters.role, filters.search, pagination.current, pagination.pageSize, sorter.sortBy, sorter.sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTableChange = (pager: any, _filters: any, tableSorter: any) => {
    setPagination(prev => ({ ...prev, current: pager.current || 1, pageSize: pager.pageSize || 10 }));
    if (tableSorter?.field) {
      setSorter({
        sortBy: tableSorter.field,
        sortOrder: tableSorter.order === 'ascend' ? 'asc' : 'desc',
      });
    }
  };

  const handleStatusToggle = async (checked: boolean, record: User) => {
    try {
      const action = checked ? userService.activate : userService.deactivate;
      await action.call(userService, record.id);
      setUsers(prev => prev.map(user => (user.id === record.id ? { ...user, isActive: checked } : user)));
      fetchStats();
      message.success(`User ${checked ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      message.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (record: User) => {
    try {
      await userService.remove(record.id);
      message.success('User deleted');
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete user');
    }
  };

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedUser(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, role: UserRole.PROJECT_MANAGER });
    setDrawerOpen(true);
  };

  const openEditDrawer = (record: User) => {
    setDrawerMode('edit');
    setSelectedUser(record);
    form.setFieldsValue({
      ...record,
      hireDate: record.hireDate ? dayjs(record.hireDate) : null,
      password: undefined,
    });
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      firstName: values.firstName?.trim(),
      lastName: values.lastName?.trim(),
      email: values.email?.trim(),
      password: values.password?.trim() || undefined,
      role: values.role,
      phone: values.phone?.trim(),
      department: values.department?.trim(),
      employeeId: values.employeeId?.trim(),
      hireDate: values.hireDate ? dayjs(values.hireDate).format('YYYY-MM-DD') : undefined,
      isActive: values.isActive ?? true,
    };

    try {
      setSaving(true);
      if (drawerMode === 'create') {
        await userService.create(payload);
        message.success('User created successfully');
      } else if (selectedUser) {
        await userService.update(selectedUser.id, payload);
        message.success('User updated successfully');
      }
      handleDrawerClose();
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      message.error(error.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setFilters({ search: '', role: undefined, department: '', isActive: undefined });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const roleDistribution = useMemo(() => {
    if (Object.keys(stats.roleBreakdown || {}).length) return stats.roleBreakdown;
    return users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [stats.roleBreakdown, users]);

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: User) => (
        <Space size={12}>
          <Avatar src={record.avatar || undefined} icon={<UserOutlined />} />
          <div>
            <div style={{ color: '#fff', fontWeight: 600 }}>
              {record.firstName} {record.lastName}
            </div>
            <Space size={4} wrap>
              <Tag icon={<MailOutlined />} color="default" style={{ marginInlineEnd: 0 }}>
                {record.email}
              </Tag>
              {record.department && (
                <Tag icon={<IdcardOutlined />} color="geekblue" style={{ marginInlineEnd: 0 }}>
                  {record.department}
                </Tag>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={roleColors[role] || 'default'}>{formatRoleLabel(role)}</Tag>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'isActive',
      render: (_: boolean, record: User) => (
        <Space size={8}>
          <Tag color={record.isActive ? statusColors.active : statusColors.inactive} style={{ marginInlineEnd: 0 }}>
            {record.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Tag>
          <Switch
            checked={record.isActive}
            size="small"
            onChange={checked => handleStatusToggle(checked, record)}
          />
        </Space>
      ),
      sorter: true,
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (value: string | undefined) => (value ? dayjs(value).format('MMM D, YYYY h:mm A') : '—'),
      sorter: true,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => dayjs(value).format('MMM D, YYYY'),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'edit',
                label: 'Edit',
                icon: <EditOutlined />,
                onClick: () => openEditDrawer(record),
              },
              {
                key: 'toggle',
                label: record.isActive ? 'Deactivate' : 'Activate',
                icon: record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
                onClick: () => handleStatusToggle(!record.isActive, record),
              },
              {
                key: 'delete',
                danger: true,
                icon: <DeleteOutlined />,
                label: (
                  <Popconfirm
                    title="Delete user?"
                    okText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => handleDelete(record)}
                  >
                    Delete
                  </Popconfirm>
                ),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            User Management
          </Title>
          <Text type="secondary">Full CRUD control, RBAC, and status management for all users</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchUsers(); fetchStats(); }}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            Add User
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #1f3524 100%)' }}>
            <Statistic
              title={<Text style={{ color: '#b3b3b3' }}>Total Users</Text>}
              value={stats.totalUsers}
              valueStyle={{ color: '#00ff88', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={8}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #0d293a 100%)' }}>
            <Statistic
              title={<Text style={{ color: '#b3b3b3' }}>Active Users</Text>}
              value={stats.activeUsers}
              valueStyle={{ color: '#009944', fontWeight: 700 }}
              prefix={<CheckCircleOutlined style={{ color: '#009944' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} lg={8}>
          <Card bordered={false} style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #3a0d1b 100%)' }}>
            <Statistic
              title={<Text style={{ color: '#b3b3b3' }}>Inactive Users</Text>}
              value={stats.inactiveUsers}
              valueStyle={{ color: '#ff4d4f', fontWeight: 700 }}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginTop: 16 }}
        title="Users"
        extra={
          <Space>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search name, email, employee ID"
              value={filters.search}
              onChange={e => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              style={{ width: 280 }}
            />
            <Select
              allowClear
              showSearch
              placeholder="Role"
              value={filters.role}
              onChange={(value) => {
                setFilters(prev => ({ ...prev, role: value }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              style={{ width: 180 }}
              optionFilterProp="label"
            >
              {ROLE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value} label={option.label}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 140 }}
              value={
                filters.isActive === undefined
                  ? undefined
                  : filters.isActive
              }
              onChange={(value) => {
                setFilters(prev => ({ ...prev, isActive: value }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              options={[
                { value: true, label: 'Active' },
                { value: false, label: 'Inactive' },
              ]}
            />
            <Input
              placeholder="Department"
              allowClear
              value={filters.department}
              onChange={e => {
                setFilters(prev => ({ ...prev, department: e.target.value }));
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              style={{ width: 200 }}
              prefix={<IdcardOutlined />}
            />
            <Button onClick={resetFilters}>Reset</Button>
          </Space>
        }
      >
        <Table
          columns={columns as any}
          dataSource={users}
          rowKey="id"
          loading={{ spinning: loading, indicator: <Spin /> }}
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="Role Distribution">
        <Row gutter={[12, 12]}>
          {ROLE_OPTIONS.map(option => (
            <Col xs={24} sm={12} md={8} lg={6} key={option.value}>
              <Card size="small" bordered style={{ background: '#111', borderColor: 'rgba(0, 153, 68, 0.2)' }}>
                <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{option.label}</Text>
                  <Badge
                    count={roleDistribution[option.value] || 0}
                    color={roleColors[option.value] || '#666'}
                    showZero
                  />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Drawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        destroyOnClose
        title={drawerMode === 'create' ? 'Add User' : 'Edit User'}
        width={520}
        extra={
          <Button onClick={handleDrawerClose} type="text">
            Close
          </Button>
        }
        styles={{
          body: { background: '#0d0d0d' },
          header: { background: '#0d0d0d' },
        }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{ isActive: true }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Enter first name' }]}
              >
                <Input placeholder="First name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Enter last name' }]}
              >
                <Input placeholder="Last name" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Enter email' }, { type: 'email', message: 'Enter a valid email' }]}
          >
            <Input placeholder="user@uadesigns.com" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={drawerMode === 'create' ? [{ required: true, message: 'Set an initial password' }] : []}
          >
            <Input.Password placeholder={drawerMode === 'create' ? 'Set password' : 'Leave blank to keep current'} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Select a role' }]}
              >
                <Select placeholder="Select role" showSearch optionFilterProp="label">
                  {ROLE_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value} label={option.label}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department">
                <Input placeholder="e.g. Architecture" prefix={<IdcardOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="Phone" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="employeeId" label="Employee ID">
                <Input placeholder="UA-xxx" prefix={<IdcardOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="hireDate" label="Hire Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleDrawerClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {drawerMode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
};

export default Users;
