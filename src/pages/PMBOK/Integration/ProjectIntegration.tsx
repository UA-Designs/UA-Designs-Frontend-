import React from 'react';
import { Card, Typography, Row, Col, Button, Space } from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const ProjectIntegration: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Integration Management</Title>
        <Text type="secondary">
          Develop project charter, manage project knowledge, and control project
          changes
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title="Project Charter"
            extra={
              <Button type="link" icon={<EditOutlined />}>
                Edit
              </Button>
            }
            actions={[
              <Button key="view" type="link" icon={<FileTextOutlined />}>
                View Document
              </Button>,
            ]}
          >
            <Text type="secondary">
              Project charter defines the project&apos;s purpose, objectives,
              and high-level requirements.
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} block>
                Create Charter
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Project Management Plan"
            extra={
              <Button type="link" icon={<EditOutlined />}>
                Edit
              </Button>
            }
            actions={[
              <Button key="view" type="link" icon={<FileTextOutlined />}>
                View Document
              </Button>,
            ]}
          >
            <Text type="secondary">
              Comprehensive document that defines how the project will be
              executed, monitored, and controlled.
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} block>
                Create Plan
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Change Requests"
            extra={
              <Button type="link" icon={<EditOutlined />}>
                Manage
              </Button>
            }
            actions={[
              <Button key="view" type="link" icon={<FileTextOutlined />}>
                View All
              </Button>,
            ]}
          >
            <Text type="secondary">
              Track and manage all change requests throughout the project
              lifecycle.
            </Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} block>
                Submit Change Request
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Project Knowledge Management">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Lessons Learned</Title>
                <Text type="secondary">
                  Document and share lessons learned from project activities to
                  improve future projects.
                </Text>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Add Lesson Learned
                  </Button>
                </div>
              </div>

              <div>
                <Title level={4}>Project Documentation</Title>
                <Text type="secondary">
                  Central repository for all project-related documents and
                  artifacts.
                </Text>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />}>
                    Upload Document
                  </Button>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectIntegration;
