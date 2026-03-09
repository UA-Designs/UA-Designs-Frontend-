import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Button,
  Avatar,
  Tag,
  Divider,
  message,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#ff4d4f',
  PROJECT_MANAGER: '#1890ff',
  ARCHITECT: '#722ed1',
  ENGINEER: '#52c41a',
  STAFF: '#9ca3af',
};

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const onProfileFinish = async (values: any) => {
    setProfileLoading(true);
    try {
      await updateProfile(values);
    } catch {
      // error already handled in context
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordFinish = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      passwordForm.resetFields();
    } catch {
      // error already handled in context
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          User Profile
        </Title>
        <Text type="secondary">
          Manage your personal information and account settings
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left column — identity card */}
        <Col xs={24} lg={7}>
          <Card
            style={{ background: '#1f1f1f', borderColor: '#2a2a2a' }}
            bodyStyle={{ textAlign: 'center', padding: '32px 24px' }}
          >
            <Avatar
              size={100}
              icon={<UserOutlined />}
              style={{
                background: 'linear-gradient(135deg, #009944, #00ff88)',
                marginBottom: 16,
                fontSize: 40,
              }}
            />
            <Title level={4} style={{ margin: '0 0 4px' }}>
              {user?.firstName} {user?.lastName}
            </Title>
            <Tag
              color={ROLE_COLORS[user?.role ?? ''] ?? '#555'}
              style={{ marginBottom: 16 }}
            >
              {roleLabel}
            </Tag>

            <Divider style={{ borderColor: '#2a2a2a' }} />

            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 12 }}>
                <MailOutlined style={{ marginRight: 8, color: '#009944' }} />
                <Text type="secondary">{user?.email}</Text>
              </div>
              {user?.phone && (
                <div style={{ marginBottom: 12 }}>
                  <PhoneOutlined style={{ marginRight: 8, color: '#009944' }} />
                  <Text type="secondary">{user.phone}</Text>
                </div>
              )}
              {user?.department && (
                <div style={{ marginBottom: 12 }}>
                  <BankOutlined style={{ marginRight: 8, color: '#009944' }} />
                  <Text type="secondary">{user.department}</Text>
                </div>
              )}
              {user?.employeeId && (
                <div style={{ marginBottom: 12 }}>
                  <IdcardOutlined style={{ marginRight: 8, color: '#009944' }} />
                  <Text type="secondary">#{user.employeeId}</Text>
                </div>
              )}
            </div>

            <Divider style={{ borderColor: '#2a2a2a' }} />

            <Row gutter={[8, 8]}>
              <Col span={12} style={{ textAlign: 'left' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Status
                </Text>
                <br />
                <Text
                  style={{
                    color: user?.isActive ? '#009944' : '#ff4d4f',
                    fontWeight: 600,
                  }}
                >
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </Col>
              <Col span={12} style={{ textAlign: 'left' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Member Since
                </Text>
                <br />
                <Text>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </Col>
              {user?.hireDate && (
                <Col span={12} style={{ textAlign: 'left' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Hire Date
                  </Text>
                  <br />
                  <Text>{new Date(user.hireDate).toLocaleDateString()}</Text>
                </Col>
              )}
              {user?.officeLocation && (
                <Col span={12} style={{ textAlign: 'left' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Office
                  </Text>
                  <br />
                  <Text>{user.officeLocation}</Text>
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        {/* Right column — forms */}
        <Col xs={24} lg={17}>
          {/* Personal Information Form */}
          <Card
            title="Personal Information"
            style={{ background: '#1f1f1f', borderColor: '#2a2a2a', marginBottom: 24 }}
          >
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email,
                phone: user?.phone,
                department: user?.department,
                employeeId: user?.employeeId,
                costCenter: user?.costCenter,
                officeLocation: user?.officeLocation,
              }}
              onFinish={onProfileFinish}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'First name is required' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Last name is required' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Email is required' },
                      { type: 'email', message: 'Enter a valid email' },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="phone" label="Phone">
                    <Input placeholder="+1 555 000 0000" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="department" label="Department">
                    <Input placeholder="e.g. Engineering" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="employeeId" label="Employee ID">
                    <Input placeholder="e.g. EMP-001" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="costCenter" label="Cost Center">
                    <Input placeholder="e.g. CC-100" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="officeLocation" label="Office Location">
                    <Input placeholder="e.g. New York" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={profileLoading}
                  style={{ background: '#009944', borderColor: '#009944' }}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Change Password Form */}
          <Card
            title={
              <span>
                <LockOutlined style={{ marginRight: 8, color: '#009944' }} />
                Change Password
              </span>
            }
            style={{ background: '#1f1f1f', borderColor: '#2a2a2a' }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={onPasswordFinish}
              style={{ maxWidth: 480 }}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Current password is required' }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'New password is required' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                rules={[{ required: true, message: 'Please confirm your new password' }]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LockOutlined />}
                  loading={passwordLoading}
                  style={{ background: '#009944', borderColor: '#009944' }}
                >
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
