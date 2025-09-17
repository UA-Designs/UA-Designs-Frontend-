import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Row,
  Col,
} from 'antd';
import { Project, ProjectStatus, ProjectPriority, ProjectType } from '../../types';
import { projectService } from '../../services/projectService';
import { useProject } from '../../contexts/ProjectContext';

const { TextArea } = Input;
const { Option } = Select;

interface ProjectCreationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (project: Project) => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { projects, setProjects } = useProject();

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const projectData = {
        name: values.name,
        clientName: values.clientName,
        description: values.description || '',
        startDate: values.startDate?.format('YYYY-MM-DD') || null,
        plannedEndDate: values.endDate?.format('YYYY-MM-DD') || null,
        budget: values.budget || 0,
        clientEmail: values.clientEmail || '',
        clientPhone: values.clientPhone || '',
        projectLocation: values.location || '',
        projectType: values.projectType || 'residential',
        priority: values.priority || 'medium'
      };

      console.log('Sending project data to backend:', projectData);
      const newProject = await projectService.createProject(projectData);
      
      // Update the projects list in context
      setProjects([...projects, newProject]);
      
      message.success('Project created successfully!');
      form.resetFields();
      onSuccess(newProject);
    } catch (error: any) {
      message.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Create New Project"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      style={{
        top: 20,
      }}
      styles={{
        body: {
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(0, 204, 102, 0.2)',
          borderRadius: '16px',
          paddingBottom: '24px',
        },
        header: {
          background: 'rgba(26, 26, 26, 0.95)',
          borderBottom: '1px solid rgba(0, 204, 102, 0.2)',
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{
          padding: '20px 0',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Project Name</span>}
              rules={[{ required: true, message: 'Please enter project name' }]}
            >
              <Input
                placeholder="Enter project name"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="projectType"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Project Type</span>}
              rules={[{ required: true, message: 'Please select project type' }]}
            >
              <Select
                placeholder="Select project type"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                }}
                dropdownStyle={{
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                }}
              >
                <Option value={ProjectType.RESIDENTIAL}>Residential</Option>
                <Option value={ProjectType.COMMERCIAL}>Commercial</Option>
                <Option value={ProjectType.INDUSTRIAL}>Industrial</Option>
                <Option value={ProjectType.INFRASTRUCTURE}>Infrastructure</Option>
                <Option value={ProjectType.RENOVATION}>Renovation</Option>
                <Option value={ProjectType.MAINTENANCE}>Maintenance</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Description</span>}
          rules={[{ required: true, message: 'Please enter project description' }]}
        >
          <TextArea
            rows={3}
            placeholder="Enter project description"
            style={{
              background: 'rgba(13, 13, 13, 0.8)',
              border: '1px solid rgba(0, 204, 102, 0.3)',
              color: '#ffffff',
            }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="priority"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Priority</span>}
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select
                placeholder="Select priority"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                }}
                dropdownStyle={{
                  background: 'rgba(26, 26, 26, 0.95)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                }}
              >
                <Option value={ProjectPriority.LOW}>Low</Option>
                <Option value={ProjectPriority.MEDIUM}>Medium</Option>
                <Option value={ProjectPriority.HIGH}>High</Option>
                <Option value={ProjectPriority.CRITICAL}>Critical</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="startDate"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Start Date</span>}
              rules={[{ required: true, message: 'Please select start date' }]}
            >
              <DatePicker
                style={{
                  width: '100%',
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                }}
                placeholder="Select start date"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="endDate"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>End Date</span>}
              rules={[{ required: true, message: 'Please select end date' }]}
            >
              <DatePicker
                style={{
                  width: '100%',
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                }}
                placeholder="Select end date"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="budget"
          label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Budget</span>}
          rules={[{ required: true, message: 'Please enter budget' }]}
        >
          <InputNumber
            style={{
              width: '100%',
              background: 'rgba(13, 13, 13, 0.8)',
              border: '1px solid rgba(0, 204, 102, 0.3)',
            }}
            placeholder="Enter budget amount"
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
            min={0}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="clientName"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Client Name</span>}
              rules={[{ required: true, message: 'Please enter client name' }]}
            >
              <Input
                placeholder="Enter client name"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="clientEmail"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Client Email</span>}
            >
              <Input
                placeholder="Enter client email"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="clientPhone"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Client Phone</span>}
            >
              <Input
                placeholder="Enter client phone"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="location"
              label={<span style={{ color: '#ffffff', fontWeight: '500' }}>Project Location</span>}
            >
              <Input
                placeholder="Enter project location"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: '32px' }}>
          <Space>
            <Button onClick={handleCancel} style={{ color: '#ffffff' }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                background: '#009944',
                borderColor: '#009944',
                fontWeight: '600',
              }}
            >
              Create Project
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectCreationModal;
