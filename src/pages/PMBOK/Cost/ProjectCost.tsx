import React from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Table,
  Statistic,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectCost: React.FC = () => {
  // Mock cost data
  const costData = [
    {
      key: '1',
      category: 'Labor',
      budgeted: 500000,
      actual: 480000,
      variance: -20000,
      percentage: 96,
    },
    {
      key: '2',
      category: 'Materials',
      budgeted: 300000,
      actual: 320000,
      variance: 20000,
      percentage: 107,
    },
    {
      key: '3',
      category: 'Equipment',
      budgeted: 200000,
      actual: 190000,
      variance: -10000,
      percentage: 95,
    },
  ];

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Budgeted',
      dataIndex: 'budgeted',
      key: 'budgeted',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Actual',
      dataIndex: 'actual',
      key: 'actual',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Variance',
      dataIndex: 'variance',
      key: 'variance',
      render: (value: number) => (
        <Text style={{ color: value < 0 ? '#009944' : '#ff4d4f' }}>
          {value < 0 ? <FallOutlined /> : <RiseOutlined />}$
          {Math.abs(value).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Percentage',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (value: number) => (
        <Progress
          percent={value}
          size="small"
          status={value > 100 ? 'exception' : 'normal'}
        />
      ),
    },
  ];

  const totalBudgeted = costData.reduce((sum, item) => sum + item.budgeted, 0);
  const totalActual = costData.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalBudgeted;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Cost Management</Title>
        <Text type="secondary">
          Plan, estimate, budget, and control project costs
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Budget"
              value={totalBudgeted}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Actual Cost"
              value={totalActual}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#009944' }}
              formatter={value => `$${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Cost Variance"
              value={totalVariance}
              prefix={
                totalVariance < 0 ? (
                  <FallOutlined />
                ) : (
                  <RiseOutlined />
                )
              }
              valueStyle={{ color: totalVariance < 0 ? '#009944' : '#ff4d4f' }}
              formatter={value =>
                `$${Math.abs(Number(value)).toLocaleString()}`
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Cost Breakdown"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add Cost Item
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={costData}
              pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>${totalBudgeted.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>${totalActual.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text
                      strong
                      style={{
                        color: totalVariance < 0 ? '#009944' : '#ff4d4f',
                      }}
                    >
                      {totalVariance < 0 ? (
                        <FallOutlined />
                      ) : (
                        <RiseOutlined />
                      )}
                      ${Math.abs(totalVariance).toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Progress
                      percent={Math.round((totalActual / totalBudgeted) * 100)}
                      size="small"
                      status={
                        totalActual > totalBudgeted ? 'exception' : 'normal'
                      }
                    />
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Cost Forecasting">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Estimated at Completion (EAC)</Text>
                <br />
                <Text type="secondary">$1,050,000</Text>
              </div>
              <div>
                <Text strong>Variance at Completion (VAC)</Text>
                <br />
                <Text type="secondary" style={{ color: '#ff4d4f' }}>
                  +$50,000 over budget
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Cost Control Actions">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Recommended Actions</Text>
                <ul>
                  <li>Review material costs and negotiate with suppliers</li>
                  <li>Optimize labor allocation to reduce overtime</li>
                  <li>Consider value engineering for non-critical items</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectCost;
