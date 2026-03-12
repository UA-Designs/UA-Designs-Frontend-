import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Spin,
  message,
  Divider,
  Badge,
  Grid,
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
  EyeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { projectService, ProjectFilters, ProjectDashboardData } from '../../services/projectService';
import { authService } from '../../services/authService';
import { Project, ProjectStatus, ProjectType, ProjectPhase, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// ─── helpers ────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  planning:    { color: 'blue',    icon: <ClockCircleOutlined />,     label: 'Planning' },
  active:      { color: 'green',   icon: <CheckCircleOutlined />,     label: 'Active' },
  in_progress: { color: 'cyan',    icon: <SyncOutlined spin />,       label: 'In Progress' },
  on_hold:     { color: 'orange',  icon: <PauseCircleOutlined />,     label: 'On Hold' },
  completed:   { color: 'purple',  icon: <CheckCircleOutlined />,     label: 'Completed' },
  cancelled:   { color: 'red',     icon: <StopOutlined />,            label: 'Cancelled' },
};

const formatCurrency = (v?: number) =>
  v !== undefined ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

// ─── component ──────────────────────────────────────────────────────────────

const Projects: React.FC = () => {
  const { user: currentUser, can } = useAuth();
  const { projects: ctxProjects, setProjects: setCtxProjects } = useProject();
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const isPM = can('MANAGER_AND_ABOVE');

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

  // Auto-open create modal when navigated from Quick Actions
  useEffect(() => {
    if ((location.state as any)?.openCreate) {
      setCreateModalVisible(true);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // ── load PM users (Project Managers + Proprietors — both can be assigned as manager) ────────────────────────────────────────────────────────
  const loadPmUsers = async () => {
    setPmLoading(true);
    try {
      const [managers, proprietors] = await Promise.all([
        authService.getUsersByRole(UserRole.PROJECT_MANAGER).catch(() => []),
        authService.getUsersByRole(UserRole.PROPRIETOR).catch(() => []),
      ]);
      const byId = new Map<string, (typeof managers)[0]>();
      [...(Array.isArray(managers) ? managers : []), ...(Array.isArray(proprietors) ? proprietors : [])].forEach((u: any) => {
        const id = u.id ?? u._id;
        if (id && !byId.has(id)) byId.set(id, u);
      });
      setPmUsers(Array.from(byId.values()));
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
        location: values.location || '',
        projectType: values.projectType || null,
        priority: values.priority || 'medium',
      };
      if (values.clientEmail?.trim()) payload.clientEmail = values.clientEmail.trim();
      if (values.clientPhone?.trim()) payload.clientPhone = values.clientPhone.trim();
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
        location: values.location || '',
        projectType: values.projectType || null,
        priority: values.priority || 'medium',
      };
      if (values.clientEmail?.trim()) payload.clientEmail = values.clientEmail.trim();
      if (values.clientPhone?.trim()) payload.clientPhone = values.clientPhone.trim();
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

  const openCreateModal = async () => {
    setCreateModalVisible(true);
    if (isPM && pmUsers.length === 0 && !pmLoading) {
      await loadPmUsers();
    }
  };

  // ── shared form fields ───────────────────────────────────────────────────
  const renderProjectFormFields = (showPM?: boolean) => (
    <>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Project name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="clientName" label="Client Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Client name" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={2} placeholder="Project description" />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="projectType" label="Project Type">
            <Select placeholder="Select type" allowClear>
              {Object.values(ProjectType).map(t => (
                <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
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
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item name="startDate" label="Start Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="endDate" label="End Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item name="budget" label="Budget (₱)">
            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="clientEmail" label="Client Email (optional)">
            <Input placeholder="email@example.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="clientPhone" label="Client Phone (optional)">
            <Input placeholder="+1 555 0000" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="location" label="Location">
        <Input placeholder="Project location" />
      </Form.Item>
      {showPM && isPM && (
        <Form.Item name="projectManagerId" label="Project Manager">
          <Select placeholder="Assign PM (optional)" allowClear loading={pmLoading}>
            {pmUsers.map(u => (
              <Option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </>
  );

  // ── go to project detail ────────────────────────────────────────────────────
  const goToProjectDetail = (project: Project, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    navigate(`/projects/${project.id}`);
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? '16px 8px' : '24px', background: 'transparent', minHeight: '100vh' }}>
      {/* Header: title, search, New Project */}
      <Row justify="space-between" align="middle" gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={isPM ? undefined : 24}>
          <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
            <ProjectOutlined style={{ color: '#009944', marginRight: 12 }} />
            Projects
          </Title>
        </Col>
        <Col xs={24} md="auto">
          <Space wrap size="middle">
            <Input
              prefix={<SearchOutlined style={{ color: '#aaa' }} />}
              placeholder="Search projects..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              allowClear
              style={{ width: isMobile ? '100%' : 280, background: '#141414', borderColor: 'rgba(0,153,68,0.3)', color: '#fff' }}
            />
            {isPM && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                style={{ background: '#009944', borderColor: '#009944' }}
              >
                New Project
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Project cards grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((record) => {
            const cfg = statusConfig[record.status] || { color: 'default', icon: null, label: record.status };
            const spent = (record as any).actualCost ?? 0;
            const remaining = Math.max(0, (record.budget ?? 0) - spent);
            const pctUsed = record.budget ? Math.round((spent / record.budget) * 100) : 0;
            const assignedCount = (record as any).teamMembers?.length ?? 0;

            const menuItems = [
              { key: 'view', icon: <EyeOutlined />, label: 'View Details', onClick: () => goToProjectDetail(record) },
              { key: 'dashboard', icon: <DashboardOutlined />, label: 'View Dashboard', onClick: () => openDashboard(record) },
              ...(isPM ? [
                { key: 'edit', icon: <EditOutlined />, label: 'Edit Project', onClick: () => openEdit(record) },
                { key: 'status', icon: <SyncOutlined />, label: 'Update Status', onClick: () => openStatusModal(record) },
                { key: 'assign', icon: <UserSwitchOutlined />, label: 'Assign Manager', onClick: () => openAssignModal(record) },
                { type: 'divider' as const },
                { key: 'delete', icon: <DeleteOutlined />, label: 'Delete Project', danger: true, onClick: () => handleDelete(record) },
              ] : []),
            ];

            return (
              <Col xs={24} sm={24} md={12} lg={12} xl={8} key={record.id}>
                <Card
                  hoverable
                  onClick={() => goToProjectDetail(record)}
                  style={{
                    background: '#1f1f1f',
                    border: '1px solid rgba(0,153,68,0.2)',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Text strong style={{ color: '#ffffff', fontSize: 15, flex: 1, marginRight: 8 }}>
                      {record.name}
                    </Text>
                    <Space size="small" onClick={e => e.stopPropagation()}>
                      <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<EllipsisOutlined />} style={{ color: '#aaa' }} onClick={e => e.stopPropagation()} />
                      </Dropdown>
                    </Space>
                  </div>
                  {record.clientName && (
                    <Text style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 10 }}>
                      {record.clientName}
                    </Text>
                  )}
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {record.location && (
                      <Text style={{ color: '#bbb', fontSize: 12 }}>
                        <EnvironmentOutlined style={{ marginRight: 6 }} />
                        {record.location}
                      </Text>
                    )}
                    <Text style={{ color: '#bbb', fontSize: 12 }}>
                      <CalendarOutlined style={{ marginRight: 6 }} />
                      {record.startDate ? dayjs(record.startDate).format('M/D/YYYY') : '—'}
                    </Text>
                    <Text style={{ color: '#bbb', fontSize: 12 }}>
                      <TeamOutlined style={{ marginRight: 6 }} />
                      {assignedCount} assigned
                    </Text>
                  </Space>
                  <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text style={{ color: '#aaa', fontSize: 12 }}>Budget: {formatCurrency(record.budget)}</Text>
                    <Text style={{ color: '#aaa', fontSize: 12 }}>Remaining: {formatCurrency(remaining)}</Text>
                    <Progress percent={pctUsed} size="small" strokeColor="#009944" showInfo={false} />
                    <Text style={{ color: '#00ff88', fontSize: 12 }}>{pctUsed}% used</Text>
                  </Space>
                  <Button
                    type="default"
                    icon={<EyeOutlined />}
                    block
                    style={{ marginTop: 16, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                    onClick={e => goToProjectDetail(record, e)}
                  >
                    View Details
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Pagination */}
      {!loading && totalCount > pageSize && (
        <Row justify="end" style={{ marginTop: 24 }}>
          <Space>
            <Text style={{ color: '#aaa' }}>
              {totalCount} projects
            </Text>
            <Button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </Space>
        </Row>
      )}

      {/* ── Create Modal ── */}
      <Modal
        title={<Text style={{ color: '#00ff88', fontSize: 16 }}>Create New Project</Text>}
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); createForm.resetFields(); }}
        footer={null}
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 10, maxWidth: 'calc(100vw - 24px)' } : undefined}
        styles={{ body: { background: '#1f1f1f', padding: isMobile ? '16px' : '24px' }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' }, content: { background: '#1f1f1f' } }}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          {renderProjectFormFields(true)}
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
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 10, maxWidth: 'calc(100vw - 24px)' } : undefined}
        styles={{ body: { background: '#1f1f1f', padding: isMobile ? '16px' : '24px' }, header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' }, content: { background: '#1f1f1f' } }}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          {renderProjectFormFields()}
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
