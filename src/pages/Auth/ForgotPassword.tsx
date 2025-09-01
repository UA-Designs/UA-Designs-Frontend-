import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import {
  MailOutlined,
  BankOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values: { email: string }) => {
    try {
      setIsLoading(true);
      await forgotPassword(values.email);
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <BankOutlined
              style={{ fontSize: 48, color: '#009944', marginBottom: 16 }}
            />
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Check Your Email
            </Title>
            <Text type="secondary">
              We&apos;ve sent a password reset link to your email address.
            </Text>
          </div>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Text>
              If you don&apos;t see the email, check your spam folder or try
              again.
            </Text>

            <Button
              type="link"
              onClick={() => setIsSubmitted(false)}
              style={{ padding: 0 }}
            >
              Try a different email address
            </Button>

            <Link to="/login">
              <Button type="primary" icon={<ArrowLeftOutlined />}>
                Back to Login
              </Button>
            </Link>
          </Space>
        </Card>
      </div>
    );
  }

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
            Forgot Password?
          </Title>
          <Text type="secondary">
            Enter your email address and we&apos;ll send you a reset link.
          </Text>
        </div>

        <Form
          name="forgotPassword"
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
            <Input prefix={<MailOutlined />} placeholder="Enter your email" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              style={{ width: '100%', height: 48 }}
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login">
            <Text type="secondary">
              <ArrowLeftOutlined /> Back to Login
            </Text>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
