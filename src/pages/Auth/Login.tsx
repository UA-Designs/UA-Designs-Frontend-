import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequest } from '../../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const onFinish = async (values: LoginRequest) => {
    try {
      await login(values);
      navigate(from, { replace: true });
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
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <BankOutlined
            style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
          />
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            UA Designs PMS
          </Title>
          <Text type="secondary">Project Management System</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              style={{ width: '100%', height: 48 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="small">
            <Link to="/forgot-password">
              <Text type="secondary">Forgot your password?</Text>
            </Link>
            <Text type="secondary">
              Don&apos;t have an account?{' '}
              <Link to="/register">
                <Text strong>Sign up here</Text>
              </Link>
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;
