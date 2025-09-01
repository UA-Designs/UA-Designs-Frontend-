import React from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
} from 'antd';
import { UserOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const onFinish = async (values: any) => {
    try {
      await updateProfile(values);
      message.success('Profile updated successfully!');
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      message.success('Avatar updated successfully!');
    } else if (info.file.status === 'error') {
      message.error('Failed to update avatar');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>User Profile</Title>
        <Text type="secondary">
          Manage your personal information and account settings
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: 16 }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user?.firstName} {user?.lastName}
                </Title>
                <Text type="secondary">
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </Text>
              </div>
              <div style={{ marginTop: 16 }}>
                <Upload
                  name="avatar"
                  showUploadList={false}
                  onChange={handleAvatarChange}
                  beforeUpload={() => false} // Prevent auto upload
                >
                  <Button icon={<CameraOutlined />}>Change Avatar</Button>
                </Upload>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Personal Information">
            <Form
              layout="vertical"
              initialValues={{
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email,
              }}
              onFinish={onFinish}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your first name!',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[
                      {
                        required: true,
                        message: 'Please input your last name!',
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Account Information">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div>
                  <Text strong>User ID</Text>
                  <br />
                  <Text type="secondary">{user?.id}</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div>
                  <Text strong>Account Status</Text>
                  <br />
                  <Text
                    type="secondary"
                    style={{ color: user?.isActive ? '#009944' : '#ff4d4f' }}
                  >
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div>
                  <Text strong>Member Since</Text>
                  <br />
                  <Text type="secondary">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'N/A'}
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

export default Profile;
