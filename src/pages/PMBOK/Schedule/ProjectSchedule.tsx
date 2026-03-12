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
  Grid,
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
import { authService } from '../../../services/authService';
import { User } from '../../../types';
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
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
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

  // Users for assignee picker
  const [users, setUsers] = useState<User[]>([]);

  // Forms
  const [taskForm] = Form.useForm();
  const [depForm] = Form.useForm();

  useEffect(() => {
    authService.getUsers().then(u => setUsers(Array.isArray(u) ? u : [])).catch(() => {});
  }, []);

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
      title: 'Task',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ScheduleTask) => (
        <Space>
          {record.isCritical && <Badge color="red" title="On critical path" />}
          <div>
            <Text strong>{name}</Text>
            {record.assignedTo && (
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {(() => { const u = users.find(x => x.id === record.assignedTo); return u ? `${u.firstName} ${u.lastName}` : null; })() || '—'}
              </div>
            )}
          </div>
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
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

      {/* ══════════════ Main column ══════════════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page title */}
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>Schedule</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>Manage tasks, dependencies, and timeline. Select a project to get started.</Text>
        </div>

        {/* Project selector card */}
        <div style={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 8, padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Text style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#9ca3af' }}>Project</Text>
            <ProjectSelector />
          </div>
          <Button icon={<ReloadOutlined />} onClick={loadScheduleData}>Refresh</Button>
        </div>

        {!selectedProject && !projectsLoading && (
          <Alert
            message="Choose a project first"
            description="Select a project from the dropdown above to view and manage its tasks, dependencies, Gantt chart, and critical path."
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
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} task${total !== 1 ? 's' : ''}` }}
                    size="small"
                    locale={{ emptyText: 'No tasks yet. Click "Add Task" to create your first task.' }}
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
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} dependenc${total !== 1 ? 'ies' : 'y'}` }}
                    size="small"
                    locale={{ emptyText: 'No dependencies yet. Add links between tasks (e.g. Task B starts after Task A finishes).' }}
                  />
                </>
              )}

              {/* ── Critical Path ── */}
              {activeTab === 'critical-path' && (
                <div style={{ padding: 24 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>Longest chain of dependent tasks; delays here affect the project end date.</Text>
                  {criticalPathData && criticalPathData.criticalPath?.length > 0 ? (
                    <>
                      <Alert
                        message={`Total duration: ${criticalPathData.totalDuration} days`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 20 }}
                      />
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10,
                        padding: '16px 20px',
                      }}>
                        {criticalPathData.criticalPath.map((task, idx) => (
                          <React.Fragment key={task.id}>
                            <div style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              background: 'rgba(220, 53, 69, 0.15)',
                              border: '1px solid rgba(220, 53, 69, 0.5)',
                              borderRadius: 6,
                              padding: '5px 12px',
                            }}>
                              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>{task.name}</span>
                              {task.duration && (
                                <span style={{ color: '#ff7875', fontSize: 11, marginTop: 2 }}>{task.duration}d</span>
                              )}
                            </div>
                            {idx < criticalPathData.criticalPath.length - 1 && (
                              <span style={{ color: '#ff7875', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Alert
                      message="No critical path yet"
                      description="Add tasks and dependencies (e.g. Finish-to-Start) so the system can compute the critical path."
                      type="info"
                      showIcon
                    />
                  )}
                </div>
              )}

              {/* ── Gantt Chart ── */}
              {activeTab === 'gantt' && (
                <div style={{ padding: 16 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>Visual timeline of tasks and their dependencies.</Text>
                  {tasks.length === 0 ? (
                    <Alert
                      message="No tasks to display"
                      description="Add tasks in the Tasks tab to see them on the Gantt chart."
                      type="info"
                      showIcon
                    />
                  ) : (
                    <GanttChart tasks={tasks} dependencies={dependencies} />
                  )}
                </div>
              )}

            </div>
          </Spin>
        )}
      </div>

      {/* ══════════════ Right sidebar: Quick Stats ══════════════ */}
      <div style={{
        width: isMobile ? '100%' : 240,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: isMobile ? 0 : 88,
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
        width={560}
        okText={editingTask ? 'Save changes' : 'Add task'}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item name="name" label="Task name" rules={[{ required: true, message: 'Enter a task name' }]}>
            <Input placeholder="e.g. Install foundation" />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <TextArea rows={2} placeholder="Brief description or notes" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue={TaskStatus.NOT_STARTED}>
                <Select placeholder="Current status">
                  {Object.values(TaskStatus).map(s => (
                    <Option key={s} value={s}>{s.replace('_', ' ')}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue={TaskPriority.MEDIUM}>
                <Select placeholder="Priority level">
                  {Object.values(TaskPriority).map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start date">
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End date">
                <DatePicker style={{ width: '100%' }} placeholder="Select date" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="progress" label="Progress %" initialValue={0} tooltip="0–100">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignedTo" label="Assigned to">
                <Select
                  placeholder="Choose team member"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={users.map(u => ({
                    value: u.id,
                    label: `${u.firstName} ${u.lastName}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Dependency Modal */}
      <Modal
        title="Add dependency"
        open={dependencyModalVisible}
        onOk={handleDepSubmit}
        onCancel={() => setDependencyModalVisible(false)}
        okText="Add dependency"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>Link two tasks so the successor depends on the predecessor (e.g. "Pour concrete" after "Install formwork").</Text>
        <Form form={depForm} layout="vertical">
          <Form.Item
            name="predecessorTaskId"
            label="Predecessor (first task)"
            rules={[{ required: true, message: 'Select the task that must be done first' }]}
          >
            <Select placeholder="Select task" showSearch optionFilterProp="children">
              {tasks.map(t => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="successorTaskId"
            label="Successor (task that follows)"
            rules={[{ required: true, message: 'Select the task that depends on the first' }]}
          >
            <Select placeholder="Select task" showSearch optionFilterProp="children">
              {tasks.map(t => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Type" initialValue={DependencyType.FS} rules={[{ required: true }]} tooltip="FS = successor starts when predecessor finishes (most common).">
            <Select placeholder="Choose type">
              <Option value={DependencyType.FS}>Finish-to-Start (most common)</Option>
              <Option value={DependencyType.SS}>Start-to-Start</Option>
              <Option value={DependencyType.FF}>Finish-to-Finish</Option>
              <Option value={DependencyType.SF}>Start-to-Finish</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectSchedule;
