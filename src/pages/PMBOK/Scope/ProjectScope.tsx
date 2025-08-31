import React from 'react';
import { Card, Typography, Row, Col, Button, Space, Tree, Input } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProjectScope: React.FC = () => {
  // Mock WBS data
  const wbsData = [
    {
      title: 'Project Management',
      key: '1',
      children: [
        { title: 'Project Planning', key: '1-1' },
        { title: 'Project Monitoring', key: '1-2' },
        { title: 'Project Control', key: '1-3' },
      ],
    },
    {
      title: 'Design Phase',
      key: '2',
      children: [
        { title: 'Architectural Design', key: '2-1' },
        { title: 'Structural Design', key: '2-2' },
        { title: 'MEP Design', key: '2-3' },
      ],
    },
    {
      title: 'Construction Phase',
      key: '3',
      children: [
        { title: 'Foundation Work', key: '3-1' },
        { title: 'Structural Work', key: '3-2' },
        { title: 'Finishing Work', key: '3-3' },
      ],
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Scope Management</Title>
        <Text type="secondary">
          Define and control what is included and excluded from the project
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Work Breakdown Structure (WBS)"
            extra={
              <Space>
                <Button type="link" icon={<PlusOutlined />}>
                  Add
                </Button>
                <Button type="link" icon={<EditOutlined />}>
                  Edit
                </Button>
              </Space>
            }
          >
            <Tree
              treeData={wbsData}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              titleRender={nodeData => (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{nodeData.title}</span>
                  <Space size="small">
                    <Button type="text" size="small" icon={<EditOutlined />} />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                    />
                  </Space>
                </div>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Project Requirements"
            extra={
              <Button type="link" icon={<PlusOutlined />}>
                Add Requirement
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Functional Requirements</Text>
                <ul>
                  <li>Building must accommodate 50+ people</li>
                  <li>Parking for 20+ vehicles</li>
                  <li>Accessibility compliance (ADA)</li>
                </ul>
              </div>

              <div>
                <Text strong>Non-Functional Requirements</Text>
                <ul>
                  <li>Energy efficiency rating: LEED Silver</li>
                  <li>Construction timeline: 12 months</li>
                  <li>Budget limit: $2M</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Scope Statement">
            <TextArea
              rows={6}
              placeholder="Enter detailed project scope statement..."
              defaultValue="This project involves the construction of a new office building for UA Designs. The building will be a 2-story structure with modern amenities, designed to accommodate the growing team and provide a professional workspace for client meetings and project collaboration."
            />
            <div style={{ marginTop: 16 }}>
              <Button type="primary" icon={<FileTextOutlined />}>
                Save Scope Statement
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Scope Validation">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Deliverables</Text>
                <ul>
                  <li>Completed office building</li>
                  <li>As-built drawings</li>
                  <li>Warranty documentation</li>
                  <li>Training materials</li>
                </ul>
              </div>

              <div>
                <Text strong>Acceptance Criteria</Text>
                <ul>
                  <li>Pass all building inspections</li>
                  <li>Meet all safety standards</li>
                  <li>Complete within budget and timeline</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectScope;
