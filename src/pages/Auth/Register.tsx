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
      {/* Animated background elements */}
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
          maxWidth: 480,
          background: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 204, 102, 0.25)',
          borderRadius: '20px',
          boxShadow: `
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(0, 204, 102, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #00cc66 0%, #00aa55 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(0, 204, 102, 0.3)',
              animation: 'neonPulse 2s ease-in-out infinite alternate',
            }}
          >
            <BankOutlined
              style={{ fontSize: 36, color: '#000000', fontWeight: 'bold' }}
            />
          </div>
          <Title level={2} style={{ margin: 0, color: '#ffffff', fontWeight: '700' }}>
            Create Account
          </Title>
          <Text style={{ color: '#b3b3b3', fontSize: '16px', fontWeight: '500' }}>
            Join UA Designs PMS
          </Text>
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
            label={<span style={{ color: '#ffffff', fontWeight: '600' }}>First Name</span>}
            rules={[
              { required: true, message: 'Please input your first name!' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#00cc66' }} />}
              placeholder="Enter your first name"
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            label={<span style={{ color: '#ffffff', fontWeight: '600' }}>Last Name</span>}
            rules={[
              { required: true, message: 'Please input your last name!' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#00cc66' }} />}
              placeholder="Enter your last name"
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: '#ffffff', fontWeight: '600' }}>Email</span>}
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#00cc66' }} />} 
              placeholder="Enter your email"
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={<span style={{ color: '#ffffff', fontWeight: '600' }}>Role</span>}
            rules={[{ required: true, message: 'Please select your role!' }]}
          >
            <Select 
              placeholder="Select your role"
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                borderRadius: '12px',
                height: '48px',
              }}
            >
              <Option value={UserRole.PROJECT_MANAGER}>Project Manager</Option>
              <Option value={UserRole.TEAM_LEAD}>Team Lead</Option>
              <Option value={UserRole.CONTRACTOR}>Contractor</Option>
              <Option value={UserRole.CLIENT}>Client</Option>
              <Option value={UserRole.VIEWER}>Viewer</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#ffffff', fontWeight: '600' }}>Password</span>}
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#00cc66' }} />}
              placeholder="Enter your password"
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ color: '#ffffff', fontWeight: '600' }}>Confirm Password</span>}
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
              prefix={<LockOutlined style={{ color: '#00cc66' }} />}
              placeholder="Confirm your password"
              style={{
                background: 'rgba(26, 26, 26, 0.8)',
                border: '1px solid rgba(0, 204, 102, 0.3)',
                borderRadius: '12px',
                color: '#ffffff',
                height: '48px',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              style={{ 
                width: '100%', 
                height: 52,
                background: 'linear-gradient(135deg, #00cc66 0%, #00aa55 100%)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 16px rgba(0, 204, 102, 0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 204, 102, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 204, 102, 0.3)';
              }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'rgba(0, 204, 102, 0.2)', margin: '24px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#b3b3b3', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login">
              <Text style={{ color: '#00cc66', fontWeight: '600', textDecoration: 'none' }}>
                Sign in here
              </Text>
            </Link>
          </Text>
        </div>
      </Card>
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }

          @keyframes neonPulse {
            0% { box-shadow: 0 8px 24px rgba(0, 204, 102, 0.3); }
            100% { box-shadow: 0 8px 24px rgba(0, 204, 102, 0.6), 0 0 20px rgba(0, 204, 102, 0.4); }
          }

          .ant-input:focus,
          .ant-input-focused {
            border-color: #00cc66 !important;
            box-shadow: 0 0 0 2px rgba(0, 204, 102, 0.25) !important;
          }

          .ant-input-password:focus,
          .ant-input-password-focused {
            border-color: #00cc66 !important;
            box-shadow: 0 0 0 2px rgba(0, 204, 102, 0.25) !important;
          }

          .ant-select:focus,
          .ant-select-focused {
            border-color: #00cc66 !important;
            box-shadow: 0 0 0 2px rgba(0, 204, 102, 0.25) !important;
          }

          .ant-select-selector {
            background: rgba(26, 26, 26, 0.8) !important;
            border: 1px solid rgba(0, 204, 102, 0.3) !important;
            border-radius: 12px !important;
            color: #ffffff !important;
            height: 48px !important;
          }

          .ant-select-selection-item {
            color: #ffffff !important;
            line-height: 46px !important;
          }

          .ant-select-selection-placeholder {
            color: #b3b3b3 !important;
            line-height: 46px !important;
          }

          .ant-form-item-label > label {
            color: #ffffff !important;
            font-weight: 600 !important;
          }

          .ant-form-item-explain-error {
            color: #ff4d4f !important;
          }
        `}
      </style>
    </div>
  );
};

export default Register;
