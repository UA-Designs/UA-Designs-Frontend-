import React from 'react';
import { Card, Typography, Row, Col, Button, Space, Table, Tag } from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Reports: React.FC = () => {
  // Mock reports data
  const reportsData = [
    {
      key: '1',
      name: 'Project Status Report',
      type: 'Status',
      createdBy: 'John Doe',
      createdDate: '2024-01-15',
      status: 'completed',
    },
    {
      key: '2',
      name: 'Cost Variance Analysis',
      type: 'Financial',
      createdBy: 'Jane Smith',
      createdDate: '2024-01-14',
      status: 'completed',
    },
    {
      key: '3',
      name: 'Risk Assessment Report',
      type: 'Risk',
      createdBy: 'Mike Johnson',
      createdDate: '2024-01-13',
      status: 'draft',
    },
  ];

  const columns = [
    {
      title: 'Report Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">
            View
          </Button>
          <Button type="link" icon={<DownloadOutlined />} size="small">
            Download
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Reports</Title>
        <Text type="secondary">Generate and manage project reports</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="Available Reports"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Generate New Report
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={reportsData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Quick Reports">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button type="default" icon={<FileTextOutlined />} block>
                Project Status Report
              </Button>
              <Button type="default" icon={<FileTextOutlined />} block>
                Cost Variance Report
              </Button>
              <Button type="default" icon={<FileTextOutlined />} block>
                Schedule Performance Report
              </Button>
              <Button type="default" icon={<FileTextOutlined />} block>
                Risk Assessment Report
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Custom Reports">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button type="default" icon={<FileTextOutlined />} block>
                Resource Utilization Report
              </Button>
              <Button type="default" icon={<FileTextOutlined />} block>
                Quality Metrics Report
              </Button>
              <Button type="default" icon={<FileTextOutlined />} block>
                Stakeholder Communication Report
              </Button>
              <Button type="default" icon={<FileTextOutlined />} block>
                Procurement Status Report
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Export Options">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button type="default" icon={<DownloadOutlined />} block>
                Export to PDF
              </Button>
              <Button type="default" icon={<DownloadOutlined />} block>
                Export to Excel
              </Button>
              <Button type="default" icon={<DownloadOutlined />} block>
                Export to CSV
              </Button>
              <Button type="default" icon={<DownloadOutlined />} block>
                Schedule Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
