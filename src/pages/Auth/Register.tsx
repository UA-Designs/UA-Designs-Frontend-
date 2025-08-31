import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Divider, Select } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterRequest, UserRole } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const Register: React.FC = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: RegisterRequest) => {
    try {
      await register(values);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 450,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <BankOutlined
            style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
          />
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Create Account
          </Title>
          <Text type="secondary">Join UA Designs PMS</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'Please input your first name!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your first name"
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: 'Please input your last name!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your last name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select your role!' }]}
          >
            <Select placeholder="Select your role">
              <Option value={UserRole.PROJECT_MANAGER}>Project Manager</Option>
              <Option value={UserRole.TEAM_LEAD}>Team Lead</Option>
              <Option value={UserRole.CONTRACTOR}>Contractor</Option>
              <Option value={UserRole.CLIENT}>Client</Option>
              <Option value={UserRole.VIEWER}>Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              style={{ width: '100%', height: 48 }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Already have an account?{' '}
            <Link to="/login">
              <Text strong>Sign in here</Text>
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
