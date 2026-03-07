import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Space, Button, Alert } from 'antd';
import {
  BankOutlined,
  ArrowLeftOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
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
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <BankOutlined
            style={{ fontSize: 48, color: '#009944', marginBottom: 16 }}
          />
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Password Reset
          </Title>
        </div>

        <Alert
          message="Password reset is not available via email."
          description="Please contact your system administrator to reset your password."
          type="info"
          showIcon
          icon={<MailOutlined />}
          style={{ marginBottom: 24, textAlign: 'left' }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary">
            Your administrator can reset your password through the user management panel.
          </Text>

          <Link to="/login">
            <Button type="primary" icon={<ArrowLeftOutlined />} style={{ width: '100%' }}>
              Back to Login
            </Button>
          </Link>
        </Space>
      </Card>
    </div>
  );
};

export default ForgotPassword;
