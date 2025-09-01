import React from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Table,
  Tag,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  UsergroupAddOutlined,
  MessageOutlined,
  StarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectStakeholders: React.FC = () => {
  // Mock stakeholder data
  const stakeholderData = [
    {
      key: '1',
      name: 'John Smith',
      organization: 'UA Designs',
      role: 'Project Sponsor',
      influence: 'High',
      interest: 'High',
      type: 'Internal',
    },
    {
      key: '2',
      name: 'Sarah Johnson',
      organization: 'City Planning',
      role: 'Regulatory Authority',
      influence: 'High',
      interest: 'Medium',
      type: 'External',
    },
    {
      key: '3',
      name: 'Mike Wilson',
      organization: 'Local Community',
      role: 'Community Representative',
      influence: 'Medium',
      interest: 'High',
      type: 'External',
    },
  ];

  const columns = [
    {
      title: 'Stakeholder',
      key: 'stakeholder',
      render: (record: any) => (
        <Space>
          <Avatar>{record.name.charAt(0)}</Avatar>
          <div>
            <div>{record.name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.organization}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Influence',
      dataIndex: 'influence',
      key: 'influence',
      render: (influence: string) => {
        const color =
          influence === 'High'
            ? 'red'
            : influence === 'Medium'
              ? 'orange'
              : 'green';
        return <Tag color={color}>{influence}</Tag>;
      },
    },
    {
      title: 'Interest',
      dataIndex: 'interest',
      key: 'interest',
      render: (interest: string) => {
        const color =
          interest === 'High'
            ? 'red'
            : interest === 'Medium'
              ? 'orange'
              : 'green';
        return <Tag color={color}>{interest}</Tag>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'Internal' ? 'blue' : 'purple'}>{type}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Stakeholder Management</Title>
        <Text type="secondary">
          Identify, analyze, and engage project stakeholders
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <UsergroupAddOutlined
                style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                }}
              >
                15
              </div>
              <Text type="secondary">Total Stakeholders</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <StarOutlined
                style={{ fontSize: 48, color: '#009944', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#009944',
                }}
              >
                8
              </div>
              <Text type="secondary">Key Stakeholders</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <MessageOutlined
                style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#faad14',
                }}
              >
                95%
              </div>
              <Text type="secondary">Engagement Rate</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Stakeholder Register"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add Stakeholder
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={stakeholderData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Stakeholder Analysis Matrix">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">Influence vs Interest Matrix</Text>
              <div
                style={{
                  marginTop: 16,
                  padding: 20,
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <Text type="secondary">
                  Visual representation of stakeholder influence and interest
                  levels
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Engagement Strategies">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>High Influence, High Interest</Text>
                <br />
                <Text type="secondary">Manage closely - Key stakeholders</Text>
              </div>
              <div>
                <Text strong>High Influence, Low Interest</Text>
                <br />
                <Text type="secondary">
                  Keep satisfied - Monitor engagement
                </Text>
              </div>
              <div>
                <Text strong>Low Influence, High Interest</Text>
                <br />
                <Text type="secondary">Keep informed - Regular updates</Text>
              </div>
              <div>
                <Text strong>Low Influence, Low Interest</Text>
                <br />
                <Text type="secondary">Monitor - Minimal effort</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectStakeholders;
