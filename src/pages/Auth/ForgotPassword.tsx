import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Typography, Space, Button, Alert } from 'antd';
import {
  ArrowLeftOutlined,
  MailOutlined,
} from '@ant-design/icons';
import Logo from '../../components/Logo/Logo';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 204, 102, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 204, 102, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(0, 204, 102, 0.10) 0%, transparent 50%),
          linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
        `,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0, 204, 102, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(0, 204, 102, 0.10) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 204, 102, 0.25)',
          borderRadius: '20px',
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(0, 255, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <Logo size="large" showText={false} />
          </div>
          <Title
            level={2}
            style={{
              color: '#ffffff',
              marginBottom: '8px',
              fontWeight: '700',
              fontSize: '26px',
            }}
          >
            Reset Password
          </Title>
          <Text style={{ color: '#b3b3b3', fontSize: '14px' }}>
            Password resets are handled by your UA Designs administrator
          </Text>
        </div>

        <Alert
          message={<span style={{ color: '#ffffff' }}>Password reset via email unavailable</span>}
          description={
            <span style={{ color: '#d9d9d9' }}>
              For security reasons, password changes are managed by your system administrator.
              Please reach out to them if you need access restored.
            </span>
          }
          type="info"
          showIcon
          icon={<MailOutlined style={{ color: '#00cc66' }} />}
          style={{
            marginBottom: 24,
            textAlign: 'left',
            background: 'rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(0, 204, 102, 0.4)',
          }}
        />

        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text style={{ color: '#b3b3b3', fontSize: '14px' }}>
            Once your password has been updated by an administrator, you can sign back in from
            the login screen using your new credentials.
          </Text>

          <Link to="/login">
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              style={{
                width: '100%',
                height: '48px',
                background: 'linear-gradient(135deg, #009944 0%, #007733 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#000000',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: '0 8px 24px rgba(0, 204, 102, 0.45)',
              }}
            >
              Back to Login
            </Button>
          </Link>
        </Space>
      </Card>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ForgotPassword;
