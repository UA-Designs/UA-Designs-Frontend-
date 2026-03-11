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
  Grid,
} from 'antd';
import { Project, ProjectStatus, ProjectPriority, ProjectType } from '../../types';
import { projectService } from '../../services/projectService';
import { useProject } from '../../contexts/ProjectContext';

const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

/** Label with red asterisk for required fields */
const requiredLabel = (text: string) => (
  <span style={{ color: '#ffffff', fontWeight: '500' }}>
    {text} <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>
  </span>
);

const optionalLabel = (text: string) => (
  <span style={{ color: '#ffffff', fontWeight: '500' }}>{text}</span>
);

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
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const projectData = {
        name: values.name,
        clientName: values.clientName,
        description: values.description || '',
        startDate: values.startDate?.format('YYYY-MM-DD') || null,
        endDate: values.endDate?.format('YYYY-MM-DD') || null,
        budget: values.budget || 0,
        clientEmail: values.clientEmail || '',
        clientPhone: values.clientPhone || '',
        location: values.location || '',
        projectType: values.projectType || 'residential',
        priority: values.priority || 'medium'
      };

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
      width={isMobile ? '100%' : 800}
      centered
      style={{
        top: isMobile ? 10 : 20,
        maxWidth: 'calc(100vw - 24px)',
        paddingBottom: 0,
      }}
      styles={{
        body: {
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(0, 204, 102, 0.2)',
          borderRadius: '16px',
          paddingBottom: '24px',
          ...(isMobile ? { maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' } : {}),
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
          padding: isMobile ? '16px 0 20px' : '20px 0',
        }}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={requiredLabel('Project Name')}
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
          <Col xs={24} sm={12}>
            <Form.Item
              name="projectType"
              label={requiredLabel('Project Type')}
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
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label={requiredLabel('Description')}
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

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="priority"
              label={requiredLabel('Priority')}
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
          <Col xs={24} sm={8}>
            <Form.Item
              name="startDate"
              label={requiredLabel('Start Date')}
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
          <Col xs={24} sm={8}>
            <Form.Item
              name="endDate"
              label={requiredLabel('End Date')}
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
          label={requiredLabel('Budget')}
          rules={[{ required: true, message: 'Please enter budget' }]}
        >
          <InputNumber
            style={{
              width: '100%',
              background: 'rgba(13, 13, 13, 0.8)',
              border: '1px solid rgba(0, 204, 102, 0.3)',
            }}
            placeholder="Enter budget amount"
            formatter={value => `₱ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value): any => Number(value!.replace(/₱\s?|(,*)/g, '')) || 0}
            min={0}
          />
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="clientName"
              label={requiredLabel('Client Name')}
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
          <Col xs={24} sm={12}>
            <Form.Item
              name="clientEmail"
              label={optionalLabel('Client Email (optional)')}
            >
              <Input
                placeholder="Enter client email (optional)"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="clientPhone"
              label={optionalLabel('Client Phone (optional)')}
            >
              <Input
                placeholder="Enter client phone (optional)"
                style={{
                  background: 'rgba(13, 13, 13, 0.8)',
                  border: '1px solid rgba(0, 204, 102, 0.3)',
                  color: '#ffffff',
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="location"
              label={optionalLabel('Project Location')}
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
