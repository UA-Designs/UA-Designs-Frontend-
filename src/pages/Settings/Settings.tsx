import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Form,
  Button,
  Select,
  Divider,
  message,
  Badge,
  Alert,
  Grid,
} from 'antd';
import {
  SaveOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { config } from '../../../env.config';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const SETTINGS_KEY = 'ua_designs_settings';

const defaultSettings = {
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
};

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [generalForm] = Form.useForm();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Load saved settings from localStorage and populate forms
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    const settings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    generalForm.setFieldsValue({
      language: settings.language,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
    });
  }, [generalForm]);

  // Check server health
  useEffect(() => {
    const check = async () => {
      try {
        await apiService.get('/auth/health');
        setServerStatus('online');
      } catch {
        setServerStatus('offline');
      }
    };
    check();
  }, []);

  const saveSettings = (section: string, values: Record<string, any>) => {
    const existing = localStorage.getItem(SETTINGS_KEY);
    const current = existing ? JSON.parse(existing) : {};
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...values }));
    message.success(`${section} settings saved`);
  };

  return (
    <div style={{ padding: isMobile ? '0 8px' : '0 4px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Settings
        </Title>
        <Text type="secondary">
          Configure your application preferences
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* General Settings */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <GlobalOutlined style={{ marginRight: 8, color: '#009944' }} />
                General Settings
              </span>
            }
            style={{ background: '#1f1f1f', borderColor: '#2a2a2a' }}
          >
            <Form
              form={generalForm}
              layout="vertical"
              onFinish={(values) => saveSettings('General', values)}
            >
              <Form.Item name="language" label="Language">
                <Select>
                  <Option value="en">English</Option>
                  <Option value="es">Spanish</Option>
                  <Option value="fr">French</Option>
                </Select>
              </Form.Item>

              <Form.Item name="timezone" label="Timezone">
                <Select>
                  <Option value="UTC">UTC</Option>
                  <Option value="EST">Eastern Time (EST)</Option>
                  <Option value="CST">Central Time (CST)</Option>
                  <Option value="MST">Mountain Time (MST)</Option>
                  <Option value="PST">Pacific Time (PST)</Option>
                  <Option value="GMT">GMT</Option>
                  <Option value="CET">Central European (CET)</Option>
                </Select>
              </Form.Item>

              <Form.Item name="dateFormat" label="Date Format">
                <Select>
                  <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                  <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                  <Option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  style={{ background: '#009944', borderColor: '#009944' }}
                >
                  Save General Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Security */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <LockOutlined style={{ marginRight: 8, color: '#009944' }} />
                Security
              </span>
            }
            style={{ background: '#1f1f1f', borderColor: '#2a2a2a' }}
          >
            <Alert
              message="Change Your Password"
              description="Password management is handled on your Profile page. Visit your profile to update your password securely."
              type="info"
              showIcon
              action={
                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#009944', borderColor: '#009944' }}
                  onClick={() => navigate('/profile')}
                >
                  Go to Profile
                </Button>
              }
              style={{ background: '#1a2a1a', borderColor: '#009944' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* System Information */}
        <Col xs={24}>
          <Card
            title={
              <span>
                <InfoCircleOutlined style={{ marginRight: 8, color: '#009944' }} />
                System Information
              </span>
            }
            style={{ background: '#1f1f1f', borderColor: '#2a2a2a' }}
          >
            <Row gutter={[16, 20]}>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Application
                </Text>
                <Text strong>{config.appName}</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Version
                </Text>
                <Text strong>v{config.version}</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Environment
                </Text>
                <Text strong style={{ textTransform: 'capitalize' }}>{config.environment}</Text>
              </Col>
              <Col span={6}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>
                  Server Status
                </Text>
                {serverStatus === 'checking' && (
                  <Badge status="processing" text="Checking..." />
                )}
                {serverStatus === 'online' && (
                  <Badge status="success" text="Online" />
                )}
                {serverStatus === 'offline' && (
                  <Badge status="error" text="Offline" />
                )}
              </Col>
            </Row>

            <Divider style={{ borderColor: '#2a2a2a', margin: '16px 0' }} />

            <Text type="secondary" style={{ fontSize: 11 }}>
              Settings are stored locally in your browser. Clearing browser data will reset preferences to defaults.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
