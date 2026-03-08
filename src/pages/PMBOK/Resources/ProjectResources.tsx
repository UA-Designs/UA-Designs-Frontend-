import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Alert,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Spin,
  Popconfirm,
  Space,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  ToolOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { useProject } from '../../../contexts/ProjectContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  resourceService,
  Material,
  Labor,
  Equipment,
  TeamMember,
  ResourceAllocation,
} from '../../../services/resourceService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ProjectResources: React.FC = () => {
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const { can } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('materials');

  // Data states
  const [materials, setMaterials] = useState<Material[]>([]);
  const [labor, setLabor] = useState<Labor[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Modal states
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [laborModalVisible, setLaborModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Forms
  const [materialForm] = Form.useForm();
  const [laborForm] = Form.useForm();
  const [equipmentForm] = Form.useForm();
  const [teamForm] = Form.useForm();
  const [allocationForm] = Form.useForm();

  useEffect(() => {
    if (selectedProject) {
      // Clear stale data when switching projects
      setMaterials([]);
      setLabor([]);
      setEquipment([]);
      setTeamMembers([]);
      setAllocations([]);
      setSummary(null);
      loadResourceData();
    }
  }, [selectedProject]);



  const loadResourceData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const pid = selectedProject.id;
      const [matResult, labResult, eqResult, teamResult, allocResult, sumResult] = await Promise.allSettled([
        resourceService.getMaterials(pid),
        resourceService.getLabor(pid),
        resourceService.getEquipment(pid),
        resourceService.getTeamMembers(pid),
        resourceService.getAllocations(pid),
        resourceService.getSummary(pid),
      ]);

      if (matResult.status === 'fulfilled') setMaterials(matResult.value);
      if (labResult.status === 'fulfilled') setLabor(labResult.value);
      if (eqResult.status === 'fulfilled') setEquipment(eqResult.value);
      if (teamResult.status === 'fulfilled') setTeamMembers(teamResult.value);
      if (allocResult.status === 'fulfilled') setAllocations(allocResult.value);
      if (sumResult.status === 'fulfilled' && sumResult.value) setSummary(sumResult.value);
    } catch {
      message.error('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Generic CRUD helpers ----

  const makeSubmitHandler = (
    form: any,
    editingItem: any,
    createFn: (data: any) => Promise<any>,
    updateFn: (id: string, data: any) => Promise<any>,
    setVisible: (v: boolean) => void,
    label: string
  ) => async () => {
    try {
      const raw = await form.validateFields();
      // Convert any dayjs values to ISO strings
      const values = Object.fromEntries(
        Object.entries(raw).map(([k, v]) =>
          v && typeof (v as any).toISOString === 'function' ? [k, (v as any).toISOString()] : [k, v]
        )
      );
      if (editingItem) {
        await updateFn(editingItem.id, values);
        message.success(`${label} updated`);
      } else {
        // Inject projectId into all create payloads
        const payload = selectedProject
          ? { ...values, projectId: selectedProject.id }
          : values;
        await createFn(payload);
        message.success(`${label} created`);
      }
      setVisible(false);
      loadResourceData();
    } catch (error: any) {
      message.error(error.message || `Failed to save ${label.toLowerCase()}`);
    }
  };

  const makeDeleteHandler = (
    deleteFn: (id: string) => Promise<void>,
    label: string
  ) => async (id: string) => {
    try {
      await deleteFn(id);
      message.success(`${label} deleted`);
      loadResourceData();
    } catch (error: any) {
      message.error(error.message || `Failed to delete ${label.toLowerCase()}`);
    }
  };

  const deleteMaterial = makeDeleteHandler(id => resourceService.deleteMaterial(id), 'Material');
  const deleteLabor = makeDeleteHandler(id => resourceService.deleteLabor(id), 'Labor');
  const deleteEquipment = makeDeleteHandler(id => resourceService.deleteEquipment(id), 'Equipment');
  const deleteTeamMember = makeDeleteHandler(id => resourceService.deleteTeamMember(id), 'Team member');
  const deleteAllocation = makeDeleteHandler(id => resourceService.deleteAllocation(id), 'Allocation');

  // ---- Edit openers ----

  const openMaterialModal = (item?: Material) => {
    setEditingItem(item || null);
    materialForm.resetFields();
    if (item) materialForm.setFieldsValue(item);
    setMaterialModalVisible(true);
  };

  const openLaborModal = (item?: Labor) => {
    setEditingItem(item || null);
    laborForm.resetFields();
    if (item) laborForm.setFieldsValue(item);
    setLaborModalVisible(true);
  };

  const openEquipmentModal = (item?: Equipment) => {
    setEditingItem(item || null);
    equipmentForm.resetFields();
    if (item) equipmentForm.setFieldsValue(item);
    setEquipmentModalVisible(true);
  };

  const openTeamModal = (item?: TeamMember) => {
    setEditingItem(item || null);
    teamForm.resetFields();
    if (item) teamForm.setFieldsValue(item);
    setTeamModalVisible(true);
  };

  const openAllocationModal = (item?: ResourceAllocation) => {
    setEditingItem(item || null);
    allocationForm.resetFields();
    if (item) allocationForm.setFieldsValue(item);
    setAllocationModalVisible(true);
  };

  // ---- Table helpers ----

  const makeActionColumn = (
    onEdit: (record: any) => void,
    onDelete: (id: string) => void,
    canEdit: boolean,
    canDelete: boolean,
  ) => ({
    title: 'Actions',
    key: 'actions',
    render: (_: any, record: any) => (
      <Space>
        {canEdit && <Button type="link" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)}>Edit</Button>}
        {canDelete && (
          <Popconfirm title="Delete this item?" onConfirm={() => onDelete(record.id)} okText="Yes" cancelText="No">
            <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        )}
      </Space>
    ),
  });

  const nameCol = { title: 'Name', dataIndex: 'name', key: 'name' };

  const tabItems = [
    { key: 'materials',   icon: <ShoppingOutlined />, label: 'Materials'   },
    { key: 'labor',       icon: null,                 label: 'Labor'       },
    { key: 'equipment',   icon: <ToolOutlined />,     label: 'Equipment'   },
    { key: 'team',        icon: <TeamOutlined />,     label: 'Team'        },
    { key: 'allocations', icon: null,                 label: 'Allocations' },
  ];

  const quickStats = [
    { icon: <TeamOutlined />,    iconBg: 'rgba(0,153,68,0.12)',   iconColor: '#009944', label: 'Team Members', value: summary?.teamMembersCount ?? teamMembers.length, valueColor: '#009944'  },
    { icon: <ToolOutlined />,    iconBg: 'rgba(0,170,255,0.12)',  iconColor: '#00aaff', label: 'Equipment',    value: summary?.equipmentCount ?? equipment.length,      valueColor: '#00aaff'  },
    { icon: <ShoppingOutlined />,iconBg: 'rgba(255,170,0,0.12)',  iconColor: '#ffaa00', label: 'Materials',    value: summary?.materialsCount ?? materials.length,      valueColor: '#ffaa00'  },
    { icon: null,                iconBg: 'rgba(114,46,209,0.12)', iconColor: '#722ed1', label: 'Utilization',  value: `${summary?.utilizationPercent ?? 0}%`,           valueColor: '#722ed1'  },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <Title level={2} style={{ marginBottom: 4 }}>Project Resource Management</Title>
            <Text type="secondary">Manage materials, labor, equipment, and team resources</Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Resource Management</Title>
            <Button
              icon={<ReloadOutlined style={{ color: '#009944' }} />}
              onClick={loadResourceData}
              style={{ background: 'transparent', borderColor: '#333333', color: '#ffffff' }}
            >
              Refresh
            </Button>
          </div>

          <div style={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 6, padding: 16 }}>
            <ProjectSelector />
          </div>

          {!selectedProject && !projectsLoading && (
            <Alert
              message={<span style={{ color: '#e2e8f0', fontWeight: 600 }}>No Project Selected</span>}
              description={<span style={{ color: '#94a3b8' }}>Please select a project to manage its resources.</span>}
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
              {/* Custom tab nav */}
              <div style={{ borderBottom: '1px solid #333333' }}>
                <div style={{ display: 'flex' }}>
                  {tabItems.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '14px 4px', marginRight: 28,
                        background: 'transparent', border: 'none',
                        borderBottom: activeTab === tab.key ? '2px solid #009944' : '2px solid transparent',
                        color: activeTab === tab.key ? '#009944' : '#9ca3af',
                        fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                        cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s', marginBottom: -1,
                      }}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content panel */}
              <div style={{ background: '#1a1a1a', border: '1px solid #333333', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>

                {/* Materials */}
                {activeTab === 'materials' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('ENGINEER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => openMaterialModal()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Material
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={[
                        nameCol,
                        { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
                        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', render: (v: any) => v ?? '—' },
                        { title: 'Unit', dataIndex: 'unit', key: 'unit', render: (v: string) => v || '—' },
                        makeActionColumn(openMaterialModal, deleteMaterial, can('ENGINEER_AND_ABOVE'), can('MANAGER_AND_ABOVE')),
                      ]}
                      dataSource={materials} rowKey="id" pagination={{ pageSize: 10 }} size="small"
                    />
                  </>
                )}

                {/* Labor */}
                {activeTab === 'labor' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('ENGINEER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => openLaborModal()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Labor
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={[
                        nameCol,
                        { title: 'Role', dataIndex: 'role', key: 'role', render: (v: string) => v || '—' },
                        { title: 'Rate', dataIndex: 'hourlyRate', key: 'hourlyRate', render: (v: number) => v ? `₱${v.toLocaleString('en-PH')}/hr` : '—' },
                        makeActionColumn(openLaborModal, deleteLabor, can('ENGINEER_AND_ABOVE'), can('MANAGER_AND_ABOVE')),
                      ]}
                      dataSource={labor} rowKey="id" pagination={{ pageSize: 10 }} size="small"
                    />
                  </>
                )}

                {/* Equipment */}
                {activeTab === 'equipment' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('ENGINEER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => openEquipmentModal()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Equipment
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={[
                        nameCol,
                        { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
                        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '—' },
                        makeActionColumn(openEquipmentModal, deleteEquipment, can('ENGINEER_AND_ABOVE'), can('MANAGER_AND_ABOVE')),
                      ]}
                      dataSource={equipment} rowKey="id" pagination={{ pageSize: 10 }} size="small"
                    />
                  </>
                )}

                {/* Team */}
                {activeTab === 'team' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('MANAGER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => openTeamModal()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Team Member
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={[
                        nameCol,
                        { title: 'Role', dataIndex: 'role', key: 'role', render: (v: string) => v || '—' },
                        { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v || '—' },
                        makeActionColumn(openTeamModal, deleteTeamMember, can('MANAGER_AND_ABOVE'), can('MANAGER_AND_ABOVE')),
                      ]}
                      dataSource={teamMembers} rowKey="id" pagination={{ pageSize: 10 }} size="small"
                    />
                  </>
                )}

                {/* Allocations */}
                {activeTab === 'allocations' && (() => {
                  // Build a name lookup from all loaded resources
                  const resourceNameMap: Record<string, string> = {};
                  materials.forEach(r => { resourceNameMap[r.id] = r.name; });
                  labor.forEach(r => { resourceNameMap[r.id] = r.name; });
                  equipment.forEach(r => { resourceNameMap[r.id] = r.name; });

                  const typeColors: Record<string, string> = {
                    MATERIAL: 'orange', LABOR: 'blue', EQUIPMENT: 'purple',
                  };
                  const statusColors: Record<string, string> = {
                    PLANNED: 'default', ALLOCATED: 'blue', IN_USE: 'green',
                    COMPLETED: 'green', RELEASED: 'gray',
                  };
                  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

                  return (
                    <>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                        {can('MANAGER_AND_ABOVE') && (
                          <Button icon={<PlusOutlined />} onClick={() => openAllocationModal()}
                            style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                            Add Allocation
                          </Button>
                        )}
                      </div>
                      <Table
                        columns={[
                          {
                            title: 'Resource',
                            key: 'resource',
                            render: (_: any, r: ResourceAllocation) => (
                              <div>
                                <div>{resourceNameMap[r.resourceId] || r.resourceId}</div>
                                <Tag color={typeColors[r.resourceType] || 'default'} style={{ marginTop: 2 }}>
                                  {r.resourceType}
                                </Tag>
                              </div>
                            ),
                          },
                          {
                            title: 'Task',
                            key: 'task',
                            render: (_: any, r: ResourceAllocation) =>
                              (r as any).task ? (r as any).task.name : '—',
                          },
                          {
                            title: 'Qty',
                            dataIndex: 'quantity',
                            key: 'quantity',
                            render: (v: any) => v ?? '—',
                          },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (v: string) => v ? <Tag color={statusColors[v] || 'default'}>{v}</Tag> : '—',
                          },
                          {
                            title: 'Start',
                            dataIndex: 'startDate',
                            key: 'startDate',
                            render: fmt,
                          },
                          {
                            title: 'End',
                            dataIndex: 'endDate',
                            key: 'endDate',
                            render: fmt,
                          },
                          {
                            title: 'Notes',
                            dataIndex: 'notes',
                            key: 'notes',
                            render: (v: string) => v
                              ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>
                              : '—',
                          },
                          makeActionColumn(openAllocationModal, deleteAllocation, can('MANAGER_AND_ABOVE'), can('MANAGER_AND_ABOVE')),
                        ]}
                        dataSource={allocations} rowKey="id" pagination={{ pageSize: 10 }} size="small"
                      />
                    </>
                  );
                })()}

              </div>
            </Spin>
          )}
        </div>

        {/* ── Quick Stats sidebar ── */}
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 88 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Stats
            </Text>
            {quickStats.map((stat, i) => (
              <div key={i} style={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.iconColor, fontSize: 20, flexShrink: 0 }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>{stat.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: stat.valueColor, lineHeight: 1 }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

      </div>

      {/* Material Modal */}
      <Modal
        title={editingItem && materialModalVisible ? 'Edit Material' : 'Add Material'}
        open={materialModalVisible}
        onOk={makeSubmitHandler(
          materialForm, editingItem,
          data => resourceService.createMaterial(data),
          (id, data) => resourceService.updateMaterial(id, data),
          setMaterialModalVisible, 'Material'
        )}
        onCancel={() => setMaterialModalVisible(false)}
      >
        <Form form={materialForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="Type"><Input /></Form.Item>
          <Form.Item name="quantity" label="Quantity"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="unit" label="Unit"><Input /></Form.Item>
          <Form.Item name="description" label="Description"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Labor Modal */}
      <Modal
        title={editingItem && laborModalVisible ? 'Edit Labor' : 'Add Labor'}
        open={laborModalVisible}
        onOk={makeSubmitHandler(
          laborForm, editingItem,
          data => resourceService.createLabor(data),
          (id, data) => resourceService.updateLabor(id, data),
          setLaborModalVisible, 'Labor'
        )}
        onCancel={() => setLaborModalVisible(false)}
      >
        <Form form={laborForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Input /></Form.Item>
          <Form.Item name="hourlyRate" label="Hourly Rate"><InputNumber min={0} style={{ width: '100%' }} prefix="₱" /></Form.Item>
          <Form.Item name="dailyRate" label="Daily Rate" rules={[{ required: true, message: 'Daily rate is required' }]}><InputNumber min={0} style={{ width: '100%' }} prefix="₱" /></Form.Item>
          <Form.Item name="description" label="Description"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Equipment Modal */}
      <Modal
        title={editingItem && equipmentModalVisible ? 'Edit Equipment' : 'Add Equipment'}
        open={equipmentModalVisible}
        onOk={makeSubmitHandler(
          equipmentForm, editingItem,
          data => resourceService.createEquipment(data),
          (id, data) => resourceService.updateEquipment(id, data),
          setEquipmentModalVisible, 'Equipment'
        )}
        onCancel={() => setEquipmentModalVisible(false)}
      >
        <Form form={equipmentForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="Type"><Input placeholder="e.g. VEHICLE, MACHINERY, TOOL" /></Form.Item>
          <Form.Item name="status" label="Status" initialValue="AVAILABLE">
            <Select>
              <Option value="AVAILABLE">Available</Option>
              <Option value="IN_USE">In Use</Option>
              <Option value="MAINTENANCE">Maintenance</Option>
              <Option value="RETIRED">Retired</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Team Member Modal */}
      <Modal
        title={editingItem && teamModalVisible ? 'Edit Team Member' : 'Add Team Member'}
        open={teamModalVisible}
        onOk={makeSubmitHandler(
          teamForm, editingItem,
          data => resourceService.createTeamMember(data),
          (id, data) => resourceService.updateTeamMember(id, data),
          setTeamModalVisible, 'Team member'
        )}
        onCancel={() => setTeamModalVisible(false)}
      >
        <Form form={teamForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* Allocation Modal */}
      <Modal
        title={editingItem && allocationModalVisible ? 'Edit Allocation' : 'Add Allocation'}
        open={allocationModalVisible}
        onOk={makeSubmitHandler(
          allocationForm, editingItem,
          data => resourceService.createAllocation(data),
          (id, data) => resourceService.updateAllocation(id, data),
          setAllocationModalVisible, 'Allocation'
        )}
        onCancel={() => setAllocationModalVisible(false)}
      >
        <Form form={allocationForm} layout="vertical">
          <Form.Item name="resourceId" label="Resource ID" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="taskId" label="Task ID"><Input /></Form.Item>
          <Form.Item name="startDate" label="Start Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="units" label="Units (%)"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectResources;
