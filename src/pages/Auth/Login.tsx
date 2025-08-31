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
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 255, 0, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(0, 255, 0, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
        `,
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0, 255, 0, 0.1) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(0, 255, 0, 0.08) 0%, transparent 70%)',
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
          border: '1px solid rgba(0, 255, 0, 0.2)',
          borderRadius: '20px',
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(0, 255, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo placeholder */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
              borderRadius: '20px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 255, 0, 0.3)',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#000000',
            }}
          >
            UA
          </div>
          <Title
            level={2}
            style={{
              color: '#ffffff',
              marginBottom: '8px',
              fontWeight: '700',
              fontSize: '28px',
            }}
          >
            Welcome Back
          </Title>
          <Text style={{ color: '#b3b3b3', fontSize: '16px' }}>
            Sign in to your UA Designs account
          </Text>
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
            label={<Text style={{ color: '#ffffff', fontWeight: '500' }}>Email Address</Text>}
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#00ff00' }} />} 
              placeholder="Enter your email"
              style={{
                background: 'rgba(13, 13, 13, 0.8)',
                border: '1px solid #333333',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
                fontSize: '16px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#ffffff', fontWeight: '500' }}>Password</Text>}
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#00ff00' }} />}
              placeholder="Enter your password"
              style={{
                background: 'rgba(13, 13, 13, 0.8)',
                border: '1px solid #333333',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
                fontSize: '16px',
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              style={{
                width: '100%',
                height: '52px',
                background: 'linear-gradient(135deg, #00ff00 0%, #00cc00 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#000000',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 8px 24px rgba(0, 255, 0, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 255, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 0, 0.4)';
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: '#333333', margin: '24px 0' }}>
          <Text style={{ color: '#666666' }}>Quick Access</Text>
        </Divider>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Link to="/forgot-password">
              <Text 
                style={{ 
                  color: '#00ff00', 
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Forgot your password?
              </Text>
            </Link>
            <Text style={{ color: '#b3b3b3', fontSize: '14px' }}>
              Don&apos;t have an account?{' '}
              <Link to="/register">
                <Text style={{ color: '#00ff00', fontWeight: '500' }}>Sign up</Text>
              </Link>
            </Text>
          </Space>
        </div>

        {/* Demo credentials */}
        <div
          style={{
            background: 'rgba(0, 255, 0, 0.05)',
            border: '1px solid rgba(0, 255, 0, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px',
          }}
        >
          <Text style={{ color: '#00ff00', fontSize: '12px', fontWeight: '500' }}>
            Demo Credentials:
          </Text>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ color: '#b3b3b3', fontSize: '12px', display: 'block' }}>
              Email: john.doe@uadesigns.com
            </Text>
            <Text style={{ color: '#b3b3b3', fontSize: '12px', display: 'block' }}>
              Password: password123
            </Text>
          </div>
        </div>
      </Card>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          
          .ant-input:focus,
          .ant-input-focused {
            border-color: #00ff00 !important;
            box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.2) !important;
          }
          
          .ant-input-password:focus,
          .ant-input-password-focused {
            border-color: #00ff00 !important;
            box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.2) !important;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
