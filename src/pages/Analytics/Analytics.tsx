import React from 'react';
import { Card, Typography, Row, Col, Select, DatePicker } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Analytics: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Analytics & Reports</Title>
        <Text type="secondary">
          Comprehensive project analytics and performance insights
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Select
            placeholder="Select Project"
            style={{ width: '100%' }}
            options={[
              { label: 'All Projects', value: 'all' },
              { label: 'Office Building Construction', value: '1' },
              { label: 'Residential Complex', value: '2' },
            ]}
          />
        </Col>
        <Col xs={24} sm={8}>
          <RangePicker style={{ width: '100%' }} />
        </Col>
        <Col xs={24} sm={8}>
          <Select
            placeholder="Select Metric"
            style={{ width: '100%' }}
            options={[
              { label: 'Cost Performance', value: 'cost' },
              { label: 'Schedule Performance', value: 'schedule' },
              { label: 'Quality Metrics', value: 'quality' },
              { label: 'Resource Utilization', value: 'resources' },
            ]}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <BarChartOutlined
                style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }}
              />
              <Title level={3} type="secondary">
                Analytics Dashboard
              </Title>
              <Text type="secondary">
                Interactive charts and detailed analytics will be displayed here
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
