import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Progress,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Popconfirm,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CalendarOutlined,
  NodeIndexOutlined,
  UnorderedListOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { useProject } from '../../../contexts/ProjectContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  scheduleService,
  ScheduleTask,
  TaskDependency,
  CriticalPathData,
  TaskStatus,
  TaskPriority,
  DependencyType,
  CreateTaskData,
  CreateDependencyData,
} from '../../../services/scheduleService';
import GanttChart from '../../../components/Schedule/GanttChart';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.NOT_STARTED]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.ON_HOLD]: 'warning',
  [TaskStatus.CANCELLED]: 'error',
};

const priorityColors: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'green',
  [TaskPriority.MEDIUM]: 'orange',
  [TaskPriority.HIGH]: 'red',
  [TaskPriority.CRITICAL]: 'purple',
};

const ProjectSchedule: React.FC = () => {
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const { can } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Data states
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [criticalPathData, setCriticalPathData] = useState<CriticalPathData | null>(null);

  // Modal states
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [dependencyModalVisible, setDependencyModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduleTask | null>(null);

  // Forms
  const [taskForm] = Form.useForm();
  const [depForm] = Form.useForm();

  useEffect(() => {
    if (selectedProject) {
      loadScheduleData();
    }
  }, [selectedProject]);



  const loadScheduleData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const [tasksResult, depsResult, cpResult] = await Promise.allSettled([
        scheduleService.getProjectTasks(selectedProject.id),
        scheduleService.getProjectDependencies(selectedProject.id),
        scheduleService.getCriticalPath(selectedProject.id),
      ]);

      if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value);
      if (depsResult.status === 'fulfilled') setDependencies(depsResult.value);
      if (cpResult.status === 'fulfilled' && cpResult.value) setCriticalPathData(cpResult.value);
    } catch {
      message.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Task CRUD ----

  const handleAddTask = () => {
    setEditingTask(null);
    taskForm.resetFields();
    setTaskModalVisible(true);
  };

  const handleEditTask = (task: ScheduleTask) => {
    setEditingTask(task);
    taskForm.setFieldsValue({
      name: task.name,
      description: task.description,
      status: task.status,
      priority: task.priority,
      startDate: task.startDate ? dayjs(task.startDate) : undefined,
      endDate: task.endDate ? dayjs(task.endDate) : undefined,
      duration: task.duration,
      progress: task.progress,
      assignedTo: task.assignedTo,
    });
    setTaskModalVisible(true);
  };

  const handleTaskSubmit = async () => {
    if (!selectedProject) return;
    try {
      const values = await taskForm.validateFields();
      const payload: CreateTaskData = {
        name: values.name,
        description: values.description,
        status: values.status,
        priority: values.priority,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        duration: values.duration,
        progress: values.progress ?? 0,
        assignedTo: values.assignedTo,
      };

      if (editingTask) {
        await scheduleService.updateTask(editingTask.id, payload);
        message.success('Task updated successfully');
      } else {
        await scheduleService.createProjectTask(selectedProject.id, payload);
        message.success('Task created successfully');
      }
      setTaskModalVisible(false);
      loadScheduleData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await scheduleService.deleteTask(taskId);
      message.success('Task deleted successfully');
      loadScheduleData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete task');
    }
  };

  // ---- Dependency CRUD ----

  const handleAddDependency = () => {
    depForm.resetFields();
    setDependencyModalVisible(true);
  };

  const handleDepSubmit = async () => {
    try {
      const values = await depForm.validateFields();
      const payload: CreateDependencyData = {
        predecessorTaskId: values.predecessorTaskId,
        successorTaskId: values.successorTaskId,
        type: values.type,
      };
      await scheduleService.createDependency(payload);
      message.success('Dependency created successfully');
      setDependencyModalVisible(false);
      loadScheduleData();
    } catch (error: any) {
      message.error(error.message || 'Failed to create dependency');
    }
  };

  const handleDeleteDependency = async (depId: string) => {
    try {
      await scheduleService.deleteDependency(depId);
      message.success('Dependency deleted successfully');
      loadScheduleData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete dependency');
    }
  };

  // ---- Summary Stats ----

  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const criticalPathLength = criticalPathData?.criticalPath?.length ?? 0;

  // ---- Table Columns ----

  const taskColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ScheduleTask) => (
        <Space>
          {record.isCritical && <Badge color="red" title="Critical" />}
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={statusColors[status]}>{status.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: TaskPriority) => (
        <Tag color={priorityColors[priority]}>{priority}</Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => <Progress percent={progress} size="small" />,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (d: string) => (d ? dayjs(d).format('MMM DD, YYYY') : '—'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (d: string) => (d ? dayjs(d).format('MMM DD, YYYY') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ScheduleTask) => (
        <Space>
          {can('ENGINEER_AND_ABOVE') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditTask(record)}
            >
              Edit
            </Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Popconfirm
              title="Delete this task?"
              onConfirm={() => handleDeleteTask(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const dependencyColumns = [
    {
      title: 'Predecessor',
      dataIndex: 'predecessorTaskId',
      key: 'predecessorTaskId',
      render: (id: string) => {
        const task = tasks.find(t => t.id === id);
        return task ? task.name : id;
      },
    },
    {
      title: 'Successor',
      dataIndex: 'successorTaskId',
      key: 'successorTaskId',
      render: (id: string) => {
        const task = tasks.find(t => t.id === id);
        return task ? task.name : id;
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: DependencyType) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TaskDependency) => (
        can('MANAGER_AND_ABOVE') ? (
          <Popconfirm
            title="Delete this dependency?"
            onConfirm={() => handleDeleteDependency(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        ) : null
      ),
    },
  ];

  /* ─── tab nav items ─── */
  const tabItems = [
    { key: 'tasks',         icon: <UnorderedListOutlined />, label: 'Tasks' },
    { key: 'dependencies',  icon: <ApartmentOutlined />,    label: 'Dependencies' },
    { key: 'critical-path', icon: <NodeIndexOutlined />,    label: 'Critical Path' },
    { key: 'gantt',         icon: <CalendarOutlined />,     label: 'Gantt Chart' },
  ];

  /* ─── quick-stat definitions ─── */
  const quickStats = [
    { icon: <UnorderedListOutlined />, iconBg: '#2a2a2a',              iconColor: '#ffffff',  label: 'Total Tasks',         value: tasks.length,       valueColor: '#ffffff'  },
    { icon: <CalendarOutlined />,      iconBg: 'rgba(0,153,68,0.12)',  iconColor: '#009944',  label: 'Completed',           value: completedCount,     valueColor: '#009944'  },
    { icon: <NodeIndexOutlined />,     iconBg: 'rgba(0,170,255,0.12)', iconColor: '#00aaff',  label: 'In Progress',         value: inProgressCount,    valueColor: '#00aaff'  },
    { icon: <NodeIndexOutlined />,     iconBg: 'rgba(255,0,64,0.12)',  iconColor: '#ff0040',  label: 'Critical Path Tasks', value: criticalPathLength, valueColor: '#ff0040'  },
  ];

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

      {/* ══════════════ Main column ══════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page title */}
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Project Schedule Management</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>Plan, develop, and control the project schedule</Text>
        </div>

        {/* "Project Management" action row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>Project Management</Title>
          <Space>
            <Button
              icon={<ReloadOutlined style={{ color: '#009944' }} />}
              onClick={loadScheduleData}
              style={{ background: 'transparent', borderColor: '#333333', color: '#ffffff' }}
            >
              Refresh
            </Button>

          </Space>
        </div>

        {/* Project selector card */}
        <div style={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 6, padding: 16 }}>
          <ProjectSelector />
        </div>

        {!selectedProject && !projectsLoading && (
          <Alert
            message={<span style={{ color: '#e2e8f0', fontWeight: 600 }}>No Project Selected</span>}
            description={<span style={{ color: '#94a3b8' }}>Please select a project to manage its schedule, tasks, and dependencies.</span>}
            type="info"
            showIcon
            style={{
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 8,
            }}
          />
        )}

        {selectedProject && (
          <Spin spinning={loading}>

            {/* Custom tab navigation */}
            <div style={{ borderBottom: '1px solid #333333' }}>
              <div style={{ display: 'flex' }}>
                {tabItems.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 4px',
                      marginRight: 28,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.key
                        ? '2px solid #009944'
                        : '2px solid transparent',
                      color: activeTab === tab.key ? '#009944' : '#9ca3af',
                      fontFamily: 'inherit',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'color 0.2s, border-color 0.2s',
                      marginBottom: -1,
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content panel */}
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              overflow: 'hidden',
            }}>

              {/* ── Tasks ── */}
              {activeTab === 'tasks' && (
                <>
                  <div style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #333333',
                  }}>
                    {can('MANAGER_AND_ABOVE') && (
                      <Button
                        icon={<PlusOutlined />}
                        onClick={handleAddTask}
                        style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}
                      >
                        Add Task
                      </Button>
                    )}
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={loadScheduleData}
                      style={{ background: 'transparent', borderColor: '#333333', color: '#ffffff' }}
                    >
                      Refresh
                    </Button>
                  </div>
                  <Table
                    columns={taskColumns}
                    dataSource={tasks}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </>
              )}

              {/* ── Dependencies ── */}
              {activeTab === 'dependencies' && (
                <>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                    {can('MANAGER_AND_ABOVE') && (
                      <Button
                        icon={<PlusOutlined />}
                        onClick={handleAddDependency}
                        style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}
                      >
                        Add Dependency
                      </Button>
                    )}
                  </div>
                  <Table
                    columns={dependencyColumns}
                    dataSource={dependencies}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </>
              )}

              {/* ── Critical Path ── */}
              {activeTab === 'critical-path' && (
                <div style={{ padding: 24 }}>
                  {criticalPathData ? (
                    <>
                      <Alert
                        message={`Total Duration: ${criticalPathData.totalDuration} days`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {criticalPathData.criticalPath.map((task, idx) => (
                          <React.Fragment key={task.id}>
                            <Tag color="red" style={{ padding: '4px 8px', fontSize: 13 }}>
                              {task.name}{task.duration ? ` (${task.duration}d)` : ''}
                            </Tag>
                            {idx < criticalPathData.criticalPath.length - 1 && (
                              <Text style={{ color: '#808080' }}>→</Text>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Alert message="No critical path data available" type="info" showIcon />
                  )}
                </div>
              )}

              {/* ── Gantt Chart ── */}
              {activeTab === 'gantt' && (
                <div style={{ padding: 16 }}>
                  <GanttChart tasks={tasks} dependencies={dependencies} />
                </div>
              )}

            </div>
          </Spin>
        )}
      </div>

      {/* ══════════════ Right sidebar: Quick Stats ══════════════ */}
      <div style={{
        width: 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: 88,
      }}>
          <Text style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Quick Stats
          </Text>

          {quickStats.map((stat, i) => (
            <div
              key={i}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: 6,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: stat.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.iconColor,
                fontSize: 20,
                flexShrink: 0,
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: stat.valueColor, lineHeight: 1 }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

      {/* Task Modal */}
      <Modal
        title={editingTask ? 'Edit Task' : 'Add Task'}
        open={taskModalVisible}
        onOk={handleTaskSubmit}
        onCancel={() => setTaskModalVisible(false)}
        width={600}
        okText={editingTask ? 'Update' : 'Create'}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item name="name" label="Task Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Enter task name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Description" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue={TaskStatus.NOT_STARTED}>
                <Select>
                  {Object.values(TaskStatus).map(s => (
                    <Option key={s} value={s}>{s.replace('_', ' ')}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue={TaskPriority.MEDIUM}>
                <Select>
                  {Object.values(TaskPriority).map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (days)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="progress" label="Progress (%)" initialValue={0}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="assignedTo" label="Assigned To (User ID)">
            <Input placeholder="User ID" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Dependency Modal */}
      <Modal
        title="Add Dependency"
        open={dependencyModalVisible}
        onOk={handleDepSubmit}
        onCancel={() => setDependencyModalVisible(false)}
        okText="Create"
      >
        <Form form={depForm} layout="vertical">
          <Form.Item
            name="predecessorTaskId"
            label="Predecessor Task"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select placeholder="Select predecessor task" showSearch>
              {tasks.map(t => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="successorTaskId"
            label="Successor Task"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select placeholder="Select successor task" showSearch>
              {tasks.map(t => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Dependency Type" initialValue={DependencyType.FS} rules={[{ required: true }]}>
            <Select>
              <Option value={DependencyType.FS}>FS — Finish-to-Start</Option>
              <Option value={DependencyType.SS}>SS — Start-to-Start</Option>
              <Option value={DependencyType.FF}>FF — Finish-to-Finish</Option>
              <Option value={DependencyType.SF}>SF — Start-to-Finish</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectSchedule;
