import React from 'react';
import { Card, Typography, Row, Col, Button, Space, Table, Tag } from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectRisk: React.FC = () => {
  // Mock risk data
  const riskData = [
    {
      key: '1',
      title: 'Weather Delays',
      category: 'External',
      probability: 'Medium',
      impact: 'High',
      priority: 'High',
      status: 'Identified',
      owner: 'John Doe',
    },
    {
      key: '2',
      title: 'Material Shortage',
      category: 'Resource',
      probability: 'Low',
      impact: 'Medium',
      priority: 'Medium',
      status: 'Analyzed',
      owner: 'Jane Smith',
    },
    {
      key: '3',
      title: 'Budget Overrun',
      category: 'Financial',
      probability: 'Medium',
      impact: 'High',
      priority: 'High',
      status: 'Monitored',
      owner: 'Mike Johnson',
    },
  ];

  const columns = [
    {
      title: 'Risk',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (probability: string) => {
        const color =
          probability === 'High'
            ? 'red'
            : probability === 'Medium'
              ? 'orange'
              : 'green';
        return <Tag color={color}>{probability}</Tag>;
      },
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: string) => {
        const color =
          impact === 'High' ? 'red' : impact === 'Medium' ? 'orange' : 'green';
        return <Tag color={color}>{impact}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color =
          priority === 'High'
            ? 'red'
            : priority === 'Medium'
              ? 'orange'
              : 'green';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'Identified'
            ? 'blue'
            : status === 'Analyzed'
              ? 'orange'
              : status === 'Monitored'
                ? 'green'
                : 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Risk Management</Title>
        <Text type="secondary">
          Identify, analyze, and manage project risks
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ExclamationCircleOutlined
                style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#ff4d4f',
                }}
              >
                3
              </div>
              <Text type="secondary">High Priority Risks</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <WarningOutlined
                style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#faad14',
                }}
              >
                5
              </div>
              <Text type="secondary">Medium Priority Risks</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#52c41a',
                }}
              >
                2
              </div>
              <Text type="secondary">Mitigated Risks</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Risk Register"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add Risk
              </Button>
            }
          >
            <Table columns={columns} dataSource={riskData} pagination={false} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Risk Mitigation Strategies">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Weather Delays</Text>
                <br />
                <Text type="secondary">
                  Monitor weather forecasts and adjust schedules accordingly
                </Text>
              </div>
              <div>
                <Text strong>Material Shortage</Text>
                <br />
                <Text type="secondary">
                  Secure multiple suppliers and maintain buffer inventory
                </Text>
              </div>
              <div>
                <Text strong>Budget Overrun</Text>
                <br />
                <Text type="secondary">
                  Regular cost monitoring and contingency planning
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Risk Monitoring">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Risk Review Frequency</Text>
                <br />
                <Text type="secondary">Weekly risk assessment meetings</Text>
              </div>
              <div>
                <Text strong>Risk Thresholds</Text>
                <br />
                <Text type="secondary">High: Immediate action required</Text>
                <br />
                <Text type="secondary">
                  Medium: Monitor and plan mitigation
                </Text>
                <br />
                <Text type="secondary">Low: Accept and monitor</Text>
              </div>
              <div>
                <Text strong>Escalation Process</Text>
                <br />
                <Text type="secondary">
                  Project Manager → Senior Management → Stakeholders
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectRisk;
