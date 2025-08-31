import React from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  List,
  Avatar,
  Tag,
  Input,
} from 'antd';
import { PlusOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProjectCommunications: React.FC = () => {
  // Mock communication data
  const communications = [
    {
      id: '1',
      title: 'Weekly Project Update',
      type: 'Report',
      sender: 'John Doe',
      date: '2024-01-15',
      status: 'sent',
    },
    {
      id: '2',
      title: 'Design Review Meeting',
      type: 'Meeting',
      sender: 'Jane Smith',
      date: '2024-01-14',
      status: 'scheduled',
    },
    {
      id: '3',
      title: 'Safety Protocol Update',
      type: 'Notification',
      sender: 'Mike Johnson',
      date: '2024-01-13',
      status: 'sent',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Report':
        return 'blue';
      case 'Meeting':
        return 'green';
      case 'Notification':
        return 'orange';
      case 'Email':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'green';
      case 'scheduled':
        return 'blue';
      case 'draft':
        return 'orange';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Communications Management</Title>
        <Text type="secondary">
          Plan, manage, and control project communications
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Recent Communications"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                New Communication
              </Button>
            }
          >
            <List
              dataSource={communications}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button key="view" type="link" size="small">
                      View
                    </Button>,
                    <Button key="edit" type="link" size="small">
                      Edit
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<MessageOutlined />} />}
                    title={
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text strong>{item.title}</Text>
                        <Tag color={getTypeColor(item.type)}>{item.type}</Tag>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary">From: {item.sender}</Text>
                        <br />
                        <Text type="secondary">Date: {item.date}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quick Message">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Input placeholder="To: Select recipients" />
              <Input placeholder="Subject" />
              <TextArea rows={4} placeholder="Type your message here..." />
              <Button type="primary" icon={<SendOutlined />} block>
                Send Message
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Communication Plan">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Stakeholder Updates</Text>
                <br />
                <Text type="secondary">Weekly status reports</Text>
              </div>
              <div>
                <Text strong>Team Meetings</Text>
                <br />
                <Text type="secondary">Daily standups, weekly reviews</Text>
              </div>
              <div>
                <Text strong>Client Communications</Text>
                <br />
                <Text type="secondary">Bi-weekly progress updates</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Communication Channels">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Email</Text>
                <br />
                <Text type="secondary">Formal communications</Text>
              </div>
              <div>
                <Text strong>Project Portal</Text>
                <br />
                <Text type="secondary">Document sharing and updates</Text>
              </div>
              <div>
                <Text strong>Meetings</Text>
                <br />
                <Text type="secondary">Face-to-face discussions</Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Communication Metrics">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Messages Sent</Text>
                <br />
                <Text type="secondary">45 this month</Text>
              </div>
              <div>
                <Text strong>Response Rate</Text>
                <br />
                <Text type="secondary">92% average</Text>
              </div>
              <div>
                <Text strong>Meeting Attendance</Text>
                <br />
                <Text type="secondary">95% average</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectCommunications;
