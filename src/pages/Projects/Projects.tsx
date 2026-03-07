import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Drawer,
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Dropdown,
  Progress,
  Avatar,
  Spin,
  message,
  Tooltip,
  Divider,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  DashboardOutlined,
  UserSwitchOutlined,
  SyncOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { projectService, ProjectFilters, ProjectDashboardData } from '../../services/projectService';
import { authService } from '../../services/authService';
import { Project, ProjectStatus, ProjectType, ProjectPhase, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';

const { Title, Text } = Typography;
const { Option } = Select;

// ─── helpers ────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  planning:    { color: 'blue',    icon: <ClockCircleOutlined />,     label: 'Planning' },
  active:      { color: 'green',   icon: <CheckCircleOutlined />,     label: 'Active' },
  in_progress: { color: 'cyan',    icon: <SyncOutlined spin />,       label: 'In Progress' },
  on_hold:     { color: 'orange',  icon: <PauseCircleOutlined />,     label: 'On Hold' },
  completed:   { color: 'purple',  icon: <CheckCircleOutlined />,     label: 'Completed' },
  cancelled:   { color: 'red',     icon: <StopOutlined />,            label: 'Cancelled' },
};

const priorityColor: Record<string, string> = {
  low: 'default', medium: 'blue', high: 'orange', critical: 'red',
};

const formatCurrency = (v?: number) =>
  v !== undefined ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

// ─── component ──────────────────────────────────────────────────────────────

const Projects: React.FC = () => {
  const { user: currentUser, can } = useAuth();
  const { projects: ctxProjects, setProjects: setCtxProjects } = useProject();

  const isAdmin = can('ADMIN_ONLY');
  const isPM    = can('MANAGER_AND_ABOVE');

  // ── list state ──────────────────────────────────────────────────────────
  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(false);
  const [totalCount, setTotalCount]   = useState(0);
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(10);
  const [stats, setStats]             = useState<any>(null);

  // filters
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType]   = useState<string>('');

  // ── modal / drawer state ─────────────────────────────────────────────────
  const [createModalVisible, setCreateModalVisible]   = useState(false);
  const [editModalVisible, setEditModalVisible]       = useState(false);
  const [statusModalVisible, setStatusModalVisible]   = useState(false);
  const [assignModalVisible, setAssignModalVisible]   = useState(false);
  const [dashboardDrawer, setDashboardDrawer]         = useState(false);

  const [selectedProject, setSelectedProject]         = useState<Project | null>(null);
  const [dashboardData, setDashboardData]             = useState<ProjectDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading]       = useState(false);

  const [pmUsers, setPmUsers]         = useState<any[]>([]);
  const [pmLoading, setPmLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm]   = Form.useForm();
  const [statusForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  // ── fetch projects ───────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ProjectFilters = { page, limit: pageSize };
      if (search)       filters.search      = search;
      if (filterStatus) filters.status      = filterStatus;
      if (filterType)   filters.projectType = filterType;

      const result = await projectService.getProjectsFiltered(filters);
      setProjects(result.projects);
      setTotalCount(result.pagination.total);
    } catch (err: any) {
      message.error(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filterStatus, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await projectService.getProjectStats();
      setStats(s);
    } catch {/* silent */}
  }, []);

  useEffect(() => { fetchProjects(); fetchStats(); }, [fetchProjects, fetchStats]);

  // ── load PM users ────────────────────────────────────────────────────────
  const loadPmUsers = async () => {
    setPmLoading(true);
    try {
      const users = await authService.getUsersByRole(UserRole.PROJECT_MANAGER);
      setPmUsers(users);
    } catch {
      message.error('Failed to load project managers');
    } finally {
      setPmLoading(false);
    }
  };

  // ── open project dashboard ───────────────────────────────────────────────
  const openDashboard = async (project: Project) => {
    setSelectedProject(project);
    setDashboardDrawer(true);
    setDashboardLoading(true);
    try {
      const data = await projectService.getProjectDashboard(project.id);
      setDashboardData(data);
    } catch (err: any) {
      message.error(err.message || 'Failed to load project dashboard');
    } finally {
      setDashboardLoading(false);
    }
  };

  // ── create project ───────────────────────────────────────────────────────
  const handleCreate = async (values: any) => {
    setActionLoading(true);
    try {
      const payload: any = {
        name: values.name,
        clientName: values.clientName,
        description: values.description || '',
        startDate: values.startDate?.format('YYYY-MM-DD') || null,
        endDate: values.endDate?.format('YYYY-MM-DD') || null,
        budget: values.budget || 0,
        clientEmail: values.clientEmail || '',
        clientPhone: values.clientPhone || '',
        location: values.location || '',
        projectType: values.projectType || null,
        priority: values.priority || 'medium',
      };
      if (values.projectManagerId) payload.projectManagerId = values.projectManagerId;

      const newProject = await projectService.createProject(payload);
      setCtxProjects([...ctxProjects, newProject]);
      message.success('Project created successfully');
      createForm.resetFields();
      setCreateModalVisible(false);
      fetchProjects();
      fetchStats();
    } catch (err: any) {
      message.error(err.message || 'Failed to create project');
    } finally {
      setActionLoading(false);
    }
  };

  // ── edit project ─────────────────────────────────────────────────────────
  const openEdit = (project: Project) => {
    setSelectedProject(project);
    editForm.setFieldsValue({
      name: project.name,
      clientName: project.clientName,
      description: project.description,
      startDate: project.startDate ? dayjs(project.startDate) : null,
      endDate: (project.endDate || project.plannedEndDate) ? dayjs(project.endDate || project.plannedEndDate) : null,
      budget: project.budget,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      location: project.location,
      projectType: project.projectType,
      priority: project.priority,
    });
    setEditModalVisible(true);
  };

  const handleEdit = async (values: any) => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      const payload: any = {
        name: values.name,
        clientName: values.clientName,
        description: values.description || '',
        startDate: values.startDate?.format('YYYY-MM-DD') || null,
        endDate: values.endDate?.format('YYYY-MM-DD') || null,
        budget: values.budget || 0,
        clientEmail: values.clientEmail || '',
        clientPhone: values.clientPhone || '',
        location: values.location || '',
        projectType: values.projectType || null,
        priority: values.priority || 'medium',
      };
      await projectService.updateProject(selectedProject.id, payload);
      message.success('Project updated successfully');
      editForm.resetFields();
      setEditModalVisible(false);
      fetchProjects();
    } catch (err: any) {
      message.error(err.message || 'Failed to update project');
    } finally {
      setActionLoading(false);
    }
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = (project: Project) => {
    Modal.confirm({
      title: 'Delete Project',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await projectService.deleteProject(project.id);
          setCtxProjects(ctxProjects.filter(p => p.id !== project.id));
          message.success('Project deleted');
          fetchProjects();
          fetchStats();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete project');
        }
      },
    });
  };

  // ── status update ────────────────────────────────────────────────────────
  const openStatusModal = (project: Project) => {
    setSelectedProject(project);
    statusForm.setFieldsValue({
      status: project.status,
      phase: (project as any).phase || null,
      actualEndDate: (project as any).actualEndDate ? dayjs((project as any).actualEndDate) : null,
    });
    setStatusModalVisible(true);
  };

  const handleStatusUpdate = async (values: any) => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      const payload: { status?: string; phase?: string; actualEndDate?: string } = {};
      if (values.status) payload.status = values.status;
      if (values.phase) payload.phase = values.phase;
      if (values.actualEndDate) payload.actualEndDate = values.actualEndDate.format('YYYY-MM-DD');
      await projectService.updateProjectStatus(selectedProject.id, payload);
      message.success('Project status updated');
      setStatusModalVisible(false);
      fetchProjects();
    } catch (err: any) {
      message.error(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // ── assign manager ───────────────────────────────────────────────────────
  const openAssignModal = async (project: Project) => {
    setSelectedProject(project);
    assignForm.setFieldsValue({ projectManagerId: project.projectManagerId });
    setAssignModalVisible(true);
    await loadPmUsers();
  };

  const handleAssignManager = async (values: any) => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      await projectService.assignProjectManager(selectedProject.id, values.projectManagerId);
      message.success('Project manager assigned successfully');
      setAssignModalVisible(false);
      fetchProjects();
    } catch (err: any) {
      message.error(err.message || 'Failed to assign project manager');
    } finally {
      setActionLoading(false);
    }
  };

  // ── table columns ────────────────────────────────────────────────────────
  const columns: ColumnsType<Project> = [
    {
      title: 'Project',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#ffffff', fontSize: 14 }}>{record.name}</Text>
          {record.projectNumber && (
            <Text type="secondary" style={{ fontSize: 12 }}>#{record.projectNumber}</Text>
          )}
          {record.clientName && (
            <Text type="secondary" style={{ fontSize: 12 }}>Client: {record.clientName}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const cfg = statusConfig[record.status] || { color: 'default', icon: null, label: record.status };
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
      width: 130,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (v: string) => (
        <Tag color={priorityColor[v] || 'default'}>{v?.toUpperCase() || '—'}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Type',
      dataIndex: 'projectType',
      key: 'projectType',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
      width: 120,
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (v: number) => (
        <Progress
          percent={v ?? 0}
          size="small"
          strokeColor="#009944"
          format={(p) => `${p}%`}
        />
      ),
      width: 140,
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (v: number) => <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text>,
      width: 120,
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => {
        const start = record.startDate ? dayjs(record.startDate).format('MMM D, YYYY') : null;
        const end   = (record.endDate || record.plannedEndDate)
          ? dayjs(record.endDate || record.plannedEndDate).format('MMM D, YYYY')
          : null;
        return (
          <Space direction="vertical" size={0}>
            {start && <Text style={{ fontSize: 12, color: '#aaa' }}>Start: {start}</Text>}
            {end   && <Text style={{ fontSize: 12, color: '#aaa' }}>End: {end}</Text>}
            {!start && !end && <Text type="secondary">—</Text>}
          </Space>
        );
      },
      width: 160,
    },
    {
      title: 'Project Manager',
      key: 'pm',
      render: (_, record) => {
        const pm = (record as any).projectManager;
        if (pm) {
          return (
            <Space>
              <Avatar size="small" style={{ background: '#009944' }}>
                {((pm.firstName?.[0] || '') + (pm.lastName?.[0] || '')).toUpperCase()}
              </Avatar>
              <Text style={{ fontSize: 12 }}>{pm.firstName} {pm.lastName}</Text>
            </Space>
          );
        }
        return <Text type="secondary">Unassigned</Text>;
      },
      width: 160,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'View Dashboard',
            onClick: () => openDashboard(record),
          },
          ...(isPM ? [
            { key: 'edit', icon: <EditOutlined />, label: 'Edit Project', onClick: () => openEdit(record) },
            { key: 'status', icon: <SyncOutlined />, label: 'Update Status', onClick: () => openStatusModal(record) },
          ] : []),
          ...(isAdmin ? [
            { key: 'assign', icon: <UserSwitchOutlined />, label: 'Assign Manager', onClick: () => openAssignModal(record) },
            { type: 'divider' as const },
            { key: 'delete', icon: <DeleteOutlined />, label: 'Delete Project', danger: true, onClick: () => handleDelete(record) },
          ] : []),
        ];
        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined />} style={{ color: '#aaa' }} />
          </Dropdown>
        );
      },
    },
  ];

  // ── shared form fields ───────────────────────────────────────────────────
  const ProjectFormFields: React.FC<{ showPM?: boolean }> = ({ showPM }) => (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Project name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="clientName" label="Client Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Client name" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={2} placeholder="Project description" />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="projectType" label="Project Type">
            <Select placeholder="Select type" allowClear>
              {Object.values(ProjectType).map(t => (
                <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="priority" label="Priority" initialValue="medium">
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
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
        <Col span={8}>
          <Form.Item name="budget" label="Budget ($)">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="clientEmail" label="Client Email">
            <Input placeholder="email@example.com" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="clientPhone" label="Client Phone">
            <Input placeholder="+1 555 0000" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="location" label="Location">
        <Input placeholder="Project location" />
      </Form.Item>
      {showPM && isAdmin && (
        <Form.Item name="projectManagerId" label="Project Manager">
          <Select placeholder="Assign PM (optional)" allowClear loading={pmLoading} onFocus={loadPmUsers}>
            {pmUsers.map(u => (
              <Option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </>
  );

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', background: 'transparent', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
            <ProjectOutlined style={{ color: '#009944', marginRight: 12 }} />
            Projects
          </Title>
          <Text type="secondary">Manage all projects across the organization</Text>
        </Col>
        {isPM && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
              style={{ background: '#009944', borderColor: '#009944' }}
            >
              New Project
            </Button>
          </Col>
        )}
      </Row>

      {/* Stats */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Projects',  value: stats.totalProjects,     color: '#ffffff', icon: <ProjectOutlined /> },
            { label: 'Active',          value: stats.activeProjects,    color: '#00ff88', icon: <CheckCircleOutlined /> },
            { label: 'On Hold',         value: stats.onHoldProjects,    color: '#fa8c16', icon: <PauseCircleOutlined /> },
            { label: 'Completed',       value: stats.completedProjects, color: '#722ed1', icon: <CheckCircleOutlined /> },
          ].map(s => (
            <Col xs={24} sm={12} md={6} key={s.label}>
              <Card
                style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
                bodyStyle={{ padding: '20px 24px' }}
              >
                <Statistic
                  title={<Text style={{ color: '#aaa', fontSize: 13 }}>{s.label}</Text>}
                  value={s.value ?? 0}
                  valueStyle={{ color: s.color, fontSize: 28, fontWeight: 700 }}
                  prefix={React.cloneElement(s.icon as React.ReactElement, { style: { marginRight: 8 } })}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Filters */}
      <Card
        style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row gutter={12} align="middle">
          <Col flex="1">
            <Input
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              placeholder="Search projects by name or client..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              allowClear
              style={{ background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }}
            />
          </Col>
          <Col>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              value={filterStatus || undefined}
              onChange={v => { setFilterStatus(v || ''); setPage(1); }}
            >
              <Option value="planning">Planning</Option>
              <Option value="active">Active</Option>
              <Option value="on_hold">On Hold</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col>
            <Select
              placeholder="Type"
              allowClear
              style={{ width: 150 }}
              value={filterType || undefined}
              onChange={v => { setFilterType(v || ''); setPage(1); }}
            >
              {Object.values(ProjectType).map(t => (
                <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); setPage(1); }}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card
        style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="id"
          dataSource={projects}
          columns={columns}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total: totalCount,
            onChange: (p) => setPage(p),
            showTotal: (t) => `${t} projects`,
            style: { padding: '16px 24px' },
          }}
          style={{ background: '#1f1f1f' }}
        />
      </Card>

      {/* ── Create Modal ── */}
      <Modal
        title={<Text style={{ color: '#00ff88', fontSize: 16 }}>Create New Project</Text>}
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); createForm.resetFields(); }}
        footer={null}
        width={800}
        styles={{ body: { background: '#1f1f1f', padding: '24px' }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' }, content: { background: '#1f1f1f' } }}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <ProjectFormFields showPM />
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading} style={{ background: '#009944', borderColor: '#009944' }}>
                Create Project
              </Button>
              <Button onClick={() => { setCreateModalVisible(false); createForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        title={<Text style={{ color: '#00ff88', fontSize: 16 }}>Edit Project</Text>}
        open={editModalVisible}
        onCancel={() => { setEditModalVisible(false); editForm.resetFields(); }}
        footer={null}
        width={800}
        styles={{ body: { background: '#1f1f1f', padding: '24px' }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' }, content: { background: '#1f1f1f' } }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <ProjectFormFields />
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading} style={{ background: '#009944', borderColor: '#009944' }}>
                Save Changes
              </Button>
              <Button onClick={() => { setEditModalVisible(false); editForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Status Update Modal ── */}
      <Modal
        title={<Text style={{ color: '#00ff88', fontSize: 16 }}>Update Project Status</Text>}
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={480}
        styles={{ body: { background: '#1f1f1f', padding: '24px' }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' }, content: { background: '#1f1f1f' } }}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate}>
          <Form.Item name="status" label="Status">
            <Select placeholder="Select status">
              <Option value="planning">Planning</Option>
              <Option value="active">Active</Option>
              <Option value="on_hold">On Hold</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phase" label="Phase">
            <Select placeholder="Select phase" allowClear>
              {Object.values(ProjectPhase).map(p => (
                <Option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="actualEndDate" label="Actual End Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading} style={{ background: '#009944', borderColor: '#009944' }}>
                Update Status
              </Button>
              <Button onClick={() => setStatusModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Assign Manager Modal ── */}
      <Modal
        title={<Text style={{ color: '#00ff88', fontSize: 16 }}>Assign Project Manager</Text>}
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={480}
        styles={{ body: { background: '#1f1f1f', padding: '24px' }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' }, content: { background: '#1f1f1f' } }}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignManager}>
          <Form.Item name="projectManagerId" label="Project Manager" rules={[{ required: true, message: 'Please select a PM' }]}>
            <Select placeholder="Select project manager" loading={pmLoading}>
              {pmUsers.map(u => (
                <Option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} — {u.email}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading} style={{ background: '#009944', borderColor: '#009944' }}>
                Assign
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Project Dashboard Drawer ── */}
      <Drawer
        title={
          <Space>
            <DashboardOutlined style={{ color: '#009944' }} />
            <Text style={{ color: '#ffffff' }}>{selectedProject?.name} — Dashboard</Text>
          </Space>
        }
        open={dashboardDrawer}
        onClose={() => { setDashboardDrawer(false); setDashboardData(null); }}
        width={600}
        styles={{
          body:   { background: '#141414', padding: '24px' },
          header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' },
          wrapper: { background: '#141414' },
        }}
      >
        {dashboardLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Spin size="large" />
          </div>
        ) : dashboardData ? (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* project info */}
            <Card style={{ background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)', borderRadius: 10 }} bodyStyle={{ padding: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title={<Text style={{ color: '#aaa', fontSize: 12 }}>Progress</Text>}
                    value={dashboardData.project?.progress ?? 0}
                    suffix="%"
                    valueStyle={{ color: '#00ff88' }}
                  />
                  <Progress percent={dashboardData.project?.progress ?? 0} strokeColor="#009944" size="small" showInfo={false} />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<Text style={{ color: '#aaa', fontSize: 12 }}>Budget</Text>}
                    value={dashboardData.project?.budget ?? 0}
                    prefix="₱"
                    valueStyle={{ color: '#ffffff' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* PMBOK counts */}
            <Row gutter={12}>
              {[
                { label: 'Tasks',         value: dashboardData.pmbokCoreAreas?.schedule?.count     ?? dashboardData.taskCount        ?? 0, icon: <CheckCircleOutlined />,      color: '#00ff88' },
                { label: 'Budgets',       value: dashboardData.pmbokCoreAreas?.cost?.count         ?? dashboardData.budgetCount      ?? 0, icon: <DollarOutlined />,           color: '#faad14' },
                { label: 'Risks',         value: dashboardData.pmbokCoreAreas?.risk?.count         ?? dashboardData.riskCount        ?? 0, icon: <ExclamationCircleOutlined />, color: '#ff4d4f' },
                { label: 'Stakeholders',  value: dashboardData.pmbokCoreAreas?.stakeholders?.count ?? dashboardData.stakeholderCount ?? 0, icon: <TeamOutlined />,             color: '#722ed1' },
                { label: 'Resources',     value: dashboardData.pmbokCoreAreas?.resources?.count    ?? 0,                                   icon: <TeamOutlined />,             color: '#1890ff' },
              ].map(item => (
                <Col span={8} key={item.label} style={{ marginBottom: 12 }}>
                  <Card style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, textAlign: 'center' }} bodyStyle={{ padding: '12px 8px' }}>
                    <div style={{ color: item.color, fontSize: 22, fontWeight: 700 }}>{item.value}</div>
                    <div style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>{item.label}</div>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* recent tasks */}
            {(dashboardData.recentActivities?.tasks || dashboardData.recentTasks)?.length > 0 && (
              <>
                <Divider style={{ borderColor: 'rgba(0,153,68,0.2)', margin: '8px 0' }} />
                <Text style={{ color: '#aaa', fontSize: 13 }}>Recent Tasks</Text>
                {(dashboardData.recentActivities?.tasks || dashboardData.recentTasks || []).slice(0, 5).map((t: any) => (
                  <Card key={t.id} size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginTop: 6 }} bodyStyle={{ padding: '10px 14px' }}>
                    <Row justify="space-between">
                      <Col><Text style={{ color: '#fff', fontSize: 13 }}>{t.name || t.title}</Text></Col>
                      <Col>
                        <Badge
                          color={t.status === 'COMPLETED' ? 'green' : t.status === 'IN_PROGRESS' ? 'blue' : 'orange'}
                          text={<Text style={{ color: '#aaa', fontSize: 11 }}>{t.status}</Text>}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </>
            )}

            {/* recent risks */}
            {(dashboardData.recentActivities?.risks || dashboardData.recentRisks)?.length > 0 && (
              <>
                <Divider style={{ borderColor: 'rgba(0,153,68,0.2)', margin: '8px 0' }} />
                <Text style={{ color: '#aaa', fontSize: 13 }}>Recent Risks</Text>
                {(dashboardData.recentActivities?.risks || dashboardData.recentRisks || []).slice(0, 5).map((r: any) => (
                  <Card key={r.id} size="small" style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginTop: 6 }} bodyStyle={{ padding: '10px 14px' }}>
                    <Row justify="space-between">
                      <Col><Text style={{ color: '#fff', fontSize: 13 }}>{r.title || r.name}</Text></Col>
                      <Col><Tag color="red" style={{ fontSize: 11 }}>{r.status}</Tag></Col>
                    </Row>
                  </Card>
                ))}
              </>
            )}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#aaa' }}>
            No dashboard data available
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Projects;
