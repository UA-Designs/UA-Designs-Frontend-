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
  Progress,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectQuality: React.FC = () => {
  // Mock quality data
  const qualityData = [
    {
      key: '1',
      title: 'Foundation Inspection',
      type: 'Inspection',
      status: 'completed',
      result: 'pass',
      inspector: 'John Doe',
      date: '2024-01-15',
    },
    {
      key: '2',
      title: 'Structural Review',
      type: 'Review',
      status: 'in_progress',
      result: 'pending',
      inspector: 'Jane Smith',
      date: '2024-01-20',
    },
    {
      key: '3',
      title: 'Safety Audit',
      type: 'Audit',
      status: 'scheduled',
      result: 'pending',
      inspector: 'Mike Johnson',
      date: '2024-01-25',
    },
  ];

  const columns = [
    {
      title: 'Quality Check',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'completed'
            ? 'green'
            : status === 'in_progress'
              ? 'blue'
              : 'orange';
        return (
          <Tag color={color}>{status.replace('_', ' ').toUpperCase()}</Tag>
        );
      },
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const color =
          result === 'pass' ? 'green' : result === 'fail' ? 'red' : 'default';
        return <Tag color={color}>{result.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Inspector',
      dataIndex: 'inspector',
      key: 'inspector',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Quality Management</Title>
        <Text type="secondary">Plan, manage, and control project quality</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: '#009944', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#009944',
                }}
              >
                95%
              </div>
              <Text type="secondary">Quality Score</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ExclamationCircleOutlined
                style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#faad14',
                }}
              >
                3
              </div>
              <Text type="secondary">Issues Found</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1890ff',
                }}
              >
                12
              </div>
              <Text type="secondary">Inspections Completed</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Quality Checks"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Schedule Quality Check
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={qualityData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Quality Metrics">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Defect Rate</Text>
                <Progress percent={5} status="active" />
              </div>
              <div>
                <Text strong>Rework Rate</Text>
                <Progress percent={8} />
              </div>
              <div>
                <Text strong>Customer Satisfaction</Text>
                <Progress percent={92} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Quality Standards">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>ISO 9001:2015</Text>
                <br />
                <Text type="secondary">Quality Management System</Text>
              </div>
              <div>
                <Text strong>LEED Certification</Text>
                <br />
                <Text type="secondary">Green Building Standards</Text>
              </div>
              <div>
                <Text strong>OSHA Compliance</Text>
                <br />
                <Text type="secondary">Safety Standards</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectQuality;
