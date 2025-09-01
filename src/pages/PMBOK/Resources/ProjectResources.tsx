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
  TeamOutlined,
  ToolOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectResources: React.FC = () => {
  // Mock resource data
  const resourceData = [
    {
      key: '1',
      name: 'John Doe',
      type: 'Human',
      role: 'Project Manager',
      status: 'allocated',
      utilization: 85,
    },
    {
      key: '2',
      name: 'Excavator',
      type: 'Equipment',
      role: 'Heavy Machinery',
      status: 'in_use',
      utilization: 70,
    },
    {
      key: '3',
      name: 'Concrete',
      type: 'Material',
      role: 'Building Material',
      status: 'available',
      utilization: 0,
    },
  ];

  const columns = [
    {
      title: 'Resource',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const color =
          type === 'Human' ? 'blue' : type === 'Equipment' ? 'green' : 'orange';
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: 'Role/Category',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'allocated'
            ? 'blue'
            : status === 'in_use'
              ? 'green'
              : status === 'available'
                ? 'default'
                : 'red';
        return (
          <Tag color={color}>{status.replace('_', ' ').toUpperCase()}</Tag>
        );
      },
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization: number) => (
        <Progress percent={utilization} size="small" />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Resource Management</Title>
        <Text type="secondary">
          Plan, acquire, and manage project resources
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined
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
              <Text type="secondary">Team Members</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ToolOutlined
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
              <Text type="secondary">Equipment Items</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ShoppingOutlined
                style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }}
              />
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#faad14',
                }}
              >
                25
              </div>
              <Text type="secondary">Material Types</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Resource Allocation"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add Resource
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={resourceData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Resource Utilization">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Human Resources</Text>
                <Progress percent={85} status="active" />
              </div>
              <div>
                <Text strong>Equipment Usage</Text>
                <Progress percent={70} />
              </div>
              <div>
                <Text strong>Material Consumption</Text>
                <Progress percent={45} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Resource Planning">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Upcoming Allocations</Text>
                <ul>
                  <li>Additional crane operator - Feb 1</li>
                  <li>Steel delivery - Feb 5</li>
                  <li>Electrical team - Feb 10</li>
                </ul>
              </div>
              <div>
                <Text strong>Resource Conflicts</Text>
                <Text type="secondary">No conflicts identified</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectResources;
