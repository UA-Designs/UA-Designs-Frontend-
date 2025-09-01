import React from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const onFinish = (values: any) => {
    console.log('Settings updated:', values);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Settings</Title>
        <Text type="secondary">
          Configure your application preferences and system settings
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="General Settings">
            <Form
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                language: 'en',
                timezone: 'UTC',
                dateFormat: 'MM/DD/YYYY',
              }}
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
                  <Option value="EST">Eastern Time</Option>
                  <Option value="PST">Pacific Time</Option>
                </Select>
              </Form.Item>

              <Form.Item name="dateFormat" label="Date Format">
                <Select>
                  <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                  <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                  <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Save General Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Notification Settings">
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="emailNotifications"
                label="Email Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="pushNotifications"
                label="Push Notifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="projectUpdates"
                label="Project Updates"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="taskAssignments"
                label="Task Assignments"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="deadlineReminders"
                label="Deadline Reminders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Save Notification Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Security Settings">
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="twoFactorAuth"
                label="Two-Factor Authentication"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="sessionTimeout"
                label="Session Timeout (minutes)"
              >
                <Input type="number" placeholder="30" />
              </Form.Item>

              <Form.Item name="passwordExpiry" label="Password Expiry (days)">
                <Input type="number" placeholder="90" />
              </Form.Item>

              <Divider />

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Save Security Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="System Information">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div>
                  <Text strong>Application Version</Text>
                  <br />
                  <Text type="secondary">v1.0.0</Text>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Last Updated</Text>
                  <br />
                  <Text type="secondary">January 15, 2024</Text>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Database Version</Text>
                  <br />
                  <Text type="secondary">PostgreSQL 14.0</Text>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Server Status</Text>
                  <br />
                  <Text type="secondary" style={{ color: '#009944' }}>
                    Online
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
