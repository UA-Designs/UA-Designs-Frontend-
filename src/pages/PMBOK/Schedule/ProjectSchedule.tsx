import React, { useState } from 'react';
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
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { Project } from '../../../types';
// import GanttChart from '../../components/Schedule/GanttChart';

const { Title, Text } = Typography;

const ProjectSchedule: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectChange = (project: Project | null) => {
    setSelectedProject(project);
  };

  // Mock task data - in real app, this would be filtered by selectedProject
  const taskData = [
    {
      key: '1',
      title: 'Project Planning',
      status: 'completed',
      progress: 100,
      assignedTo: 'John Doe',
      dueDate: '2024-01-15',
      priority: 'high',
    },
    {
      key: '2',
      title: 'Design Phase',
      status: 'in_progress',
      progress: 75,
      assignedTo: 'Jane Smith',
      dueDate: '2024-02-28',
      priority: 'high',
    },
    {
      key: '3',
      title: 'Foundation Work',
      status: 'todo',
      progress: 0,
      assignedTo: 'Mike Johnson',
      dueDate: '2024-03-15',
      priority: 'medium',
    },
  ];

  const columns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
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
              : 'default';
        return (
          <Tag color={color}>{status.replace('_', ' ').toUpperCase()}</Tag>
        );
      },
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const color =
          priority === 'high'
            ? 'red'
            : priority === 'medium'
              ? 'orange'
              : 'green';
        return <Tag color={color}>{priority.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small">
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Schedule Management</Title>
        <Text type="secondary">
          Plan, develop, and control the project schedule
        </Text>
      </div>

      <ProjectSelector onProjectChange={handleProjectChange} />

      {!selectedProject && (
        <Alert
          message="No Project Selected"
          description="Please select a project from the dropdown above to manage its schedule, tasks, and milestones."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="Gantt Chart"
            extra={
              <Space>
                <Button type="link" icon={<CalendarOutlined />}>
                  Timeline View
                </Button>
                <Button type="link" icon={<ClockCircleOutlined />}>
                  Critical Path
                </Button>
              </Space>
            }
          >
            {/* <GanttChart /> */}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="Task List"
            extra={
              <Button type="primary" icon={<PlusOutlined />}>
                Add Task
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={taskData}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="Schedule Performance">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Schedule Variance</Text>
                <br />
                <Text type="secondary">-5 days behind schedule</Text>
              </div>
              <div>
                <Text strong>Critical Path</Text>
                <br />
                <Text type="secondary">
                  Design Phase → Foundation Work → Construction
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Resource Allocation">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Team Utilization</Text>
                <br />
                <Progress percent={85} status="active" />
              </div>
              <div>
                <Text strong>Equipment Usage</Text>
                <br />
                <Progress percent={70} />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Milestones">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Upcoming Milestones</Text>
                <ul>
                  <li>Design Approval - Feb 15, 2024</li>
                  <li>Foundation Complete - Mar 30, 2024</li>
                  <li>Construction Start - Apr 1, 2024</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProjectSchedule;
