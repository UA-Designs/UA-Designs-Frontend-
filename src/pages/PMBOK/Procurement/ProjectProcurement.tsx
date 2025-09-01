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
  ShoppingCartOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectProcurement: React.FC = () => {
  // Mock procurement data
  const procurementData = [
    {
      key: '1',
      title: 'Steel Beams',
      vendor: 'SteelCorp Inc.',
      value: 50000,
      status: 'ordered',
      deliveryDate: '2024-02-15',
    },
    {
      key: '2',
      title: 'Concrete Mix',
      vendor: 'Concrete Solutions',
      value: 25000,
      status: 'delivered',
      deliveryDate: '2024-01-20',
    },
    {
      key: '3',
      title: 'Electrical Equipment',
      vendor: 'Power Systems Ltd.',
      value: 75000,
      status: 'pending',
      deliveryDate: '2024-03-01',
    },
  ];

  const columns = [
    {
      title: 'Item',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'delivered'
            ? 'green'
            : status === 'ordered'
              ? 'blue'
              : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Delivery Date',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Procurement Management</Title>
        <Text type="secondary">
          Plan, conduct, and control project procurement
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ShoppingCartOutlined
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
              <Text type="secondary">Active Contracts</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined
                style={{ fontSize: 48, color: '#009944', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#009944',
                }}
              >
                $150K
              </div>
              <Text type="secondary">Total Procurement Value</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined
                style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#faad14',
                }}
              >
                8
              </div>
              <Text type="secondary">Pending Deliveries</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Procurement Items"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                New Procurement
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={procurementData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Vendor Management">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Approved Vendors</Text>
                <br />
                <Text type="secondary">15 vendors in database</Text>
              </div>
              <div>
                <Text strong>Vendor Performance</Text>
                <br />
                <Progress percent={85} />
              </div>
              <div>
                <Text strong>Contract Compliance</Text>
                <br />
                <Progress percent={92} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Procurement Process">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>1. Requirements Definition</Text>
                <br />
                <Text type="secondary">
                  Define procurement needs and specifications
                </Text>
              </div>
              <div>
                <Text strong>2. Vendor Selection</Text>
                <br />
                <Text type="secondary">
                  Evaluate and select appropriate vendors
                </Text>
              </div>
              <div>
                <Text strong>3. Contract Management</Text>
                <br />
                <Text type="secondary">
                  Monitor contract performance and compliance
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectProcurement;
