import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Avatar,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Popconfirm,
  Space,
  Empty,
  List,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  MessageOutlined,
  StarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from 'recharts';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { ChartErrorBoundary } from '../../../components/Charts/ChartErrorBoundary';
import { useProject } from '../../../contexts/ProjectContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  stakeholderService,
  Stakeholder,
  Communication,
  EngagementRecord,
} from '../../../services/stakeholderService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

// ---- Helpers ----

const influenceColor = (level: string) =>
  level === 'HIGH' ? 'red' : level === 'MEDIUM' ? 'orange' : 'green';

// ---- Component ----

const ProjectStakeholders: React.FC = () => {
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const { can } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('register');

  // Data states
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [engagementMap, setEngagementMap] = useState<Record<string, EngagementRecord[]>>({});
  const [influenceMatrix, setInfluenceMatrix] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  // Stakeholder modal
  const [stakeholderModalVisible, setStakeholderModalVisible] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [stakeholderForm] = Form.useForm();

  // Communication modal
  const [commModalVisible, setCommModalVisible] = useState(false);
  const [editingComm, setEditingComm] = useState<Communication | null>(null);
  const [selectedStakeholderForComm, setSelectedStakeholderForComm] = useState<string>('');
  const [commForm] = Form.useForm();

  // Engagement / Feedback
  const [selectedStakeholderForEng, setSelectedStakeholderForEng] = useState<string>('');
  const [feedbackForm] = Form.useForm();
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [engagementForm] = Form.useForm();
  const [engagementSubmitting, setEngagementSubmitting] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      // Clear stale data when switching projects
      setStakeholders([]);
      setCommunications([]);
      setEngagementMap({});
      setInfluenceMatrix(null);
      setSummary(null);
      loadData();
    }
  }, [selectedProject]);



  const loadData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const pid = selectedProject.id;
      const [stResult, commResult, matResult, sumResult] = await Promise.allSettled([
        stakeholderService.getStakeholders(pid),
        stakeholderService.getAllCommunications(pid),
        stakeholderService.getInfluenceMatrix(pid),
        stakeholderService.getSummary(pid),
      ]);

      if (stResult.status === 'fulfilled') setStakeholders(stResult.value);
      if (commResult.status === 'fulfilled') setCommunications(commResult.value);
      if (matResult.status === 'fulfilled' && matResult.value) setInfluenceMatrix(matResult.value);
      if (sumResult.status === 'fulfilled' && sumResult.value) setSummary(sumResult.value);
    } catch {
      message.error('Failed to load stakeholder data');
    } finally {
      setLoading(false);
    }
  };

  // Load engagement records for a specific stakeholder
  const loadEngagement = async (stakeholderId: string) => {
    try {
      const records = await stakeholderService.getEngagement(stakeholderId);
      setEngagementMap(prev => ({ ...prev, [stakeholderId]: records }));
    } catch {
      message.error('Failed to load engagement records');
    }
  };

  // ---- Stakeholder CRUD ----

  const openStakeholderModal = (item?: Stakeholder) => {
    setEditingStakeholder(item || null);
    stakeholderForm.resetFields();
    if (item) stakeholderForm.setFieldsValue(item);
    setStakeholderModalVisible(true);
  };

  const handleStakeholderSubmit = async () => {
    try {
      const values = await stakeholderForm.validateFields();
      const payload = { ...values, projectId: selectedProject!.id };
      if (editingStakeholder) {
        await stakeholderService.updateStakeholder(editingStakeholder.id, payload);
        message.success('Stakeholder updated');
      } else {
        await stakeholderService.createStakeholder(payload);
        message.success('Stakeholder created');
      }
      setStakeholderModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save stakeholder');
    }
  };

  const handleDeleteStakeholder = async (id: string) => {
    try {
      await stakeholderService.deleteStakeholder(id);
      message.success('Stakeholder deleted');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete stakeholder');
    }
  };

  // ---- Communication CRUD ----

  const openCommModal = (comm?: Communication) => {
    setEditingComm(comm || null);
    commForm.resetFields();
    if (comm) {
      commForm.setFieldsValue(comm);
      setSelectedStakeholderForComm(comm.stakeholderId);
    } else {
      setSelectedStakeholderForComm('');
    }
    setCommModalVisible(true);
  };

  const handleCommSubmit = async () => {
    try {
      const values = await commForm.validateFields();
      if (values.date) values.date = values.date.toISOString();
      if (editingComm) {
        await stakeholderService.updateCommunication(editingComm.id, values);
        message.success('Communication updated');
      } else {
        if (!selectedStakeholderForComm) {
          message.error('Please select a stakeholder');
          return;
        }
        await stakeholderService.createCommunication(selectedStakeholderForComm, values);
        message.success('Communication logged');
      }
      setCommModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save communication');
    }
  };

  const handleDeleteComm = async (commId: string) => {
    try {
      await stakeholderService.deleteCommunication(commId);
      message.success('Communication deleted');
      loadData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete communication');
    }
  };

  // ---- Engagement & Feedback ----

  const handleEngagementSubmit = async () => {
    if (!selectedStakeholderForEng) { message.error('Select a stakeholder first'); return; }
    setEngagementSubmitting(true);
    try {
      const values = await engagementForm.validateFields();
      await stakeholderService.createEngagement(selectedStakeholderForEng, values);
      message.success('Engagement record saved');
      engagementForm.resetFields();
      loadEngagement(selectedStakeholderForEng);
    } catch (error: any) {
      message.error(error.message || 'Failed to save engagement');
    } finally {
      setEngagementSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedStakeholderForEng) { message.error('Select a stakeholder first'); return; }
    setFeedbackSubmitting(true);
    try {
      const values = await feedbackForm.validateFields();
      await stakeholderService.recordFeedback(selectedStakeholderForEng, values);
      message.success('Feedback recorded');
      feedbackForm.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Failed to record feedback');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // ---- Influence Matrix chart data ----
  const safeNum = (n: unknown, fallback = 5): number => {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  };

  const LEVEL_NUM: Record<string, number> = { LOW: 2, MEDIUM: 5, HIGH: 8 };

  const matrixPoints = React.useMemo(() => {
    if (!influenceMatrix?.matrix) return [];
    const points: { name: string; x: number; y: number; strategy: string }[] = [];
    Object.values(influenceMatrix.matrix).forEach((cell: any) => {
      (cell.stakeholders || []).forEach((s: any) => {
        const x = safeNum(LEVEL_NUM?.[cell?.interest], 5);
        const y = safeNum(LEVEL_NUM?.[cell?.influence], 5);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        points.push({
          name: s?.name ?? 'Unnamed',
          x,
          y,
          strategy: cell?.strategy ?? '',
        });
      });
    });
    return points;
  }, [influenceMatrix]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#009944" fillOpacity={0.8} stroke="#00ff88" strokeWidth={1} />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#ccc" fontSize={11}>{payload.name}</text>
      </g>
    );
  };

  // ---- Table columns ----

  const stakeholderColumns = [
    {
      title: 'Stakeholder',
      key: 'stakeholder',
      render: (_: any, record: Stakeholder) => (
        <Space>
          <Avatar style={{ backgroundColor: '#009944' }}>
            {(record.name || 'S').charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div>{record.name}</div>
            {record.organization && (
              <Text type="secondary" style={{ fontSize: 12 }}>{record.organization}</Text>
            )}
          </div>
        </Space>
      ),
    },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (v: string) => v || '—' },
    {
      title: 'Influence',
      dataIndex: 'influence',
      key: 'influence',
      render: (v: string) => v ? <Tag color={influenceColor(v)}>{v}</Tag> : '—',
    },
    {
      title: 'Interest',
      dataIndex: 'interest',
      key: 'interest',
      render: (v: string) => v ? <Tag color={influenceColor(v)}>{v}</Tag> : '—',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => v ? <Tag color={v === 'INTERNAL' ? 'blue' : 'purple'}>{v}</Tag> : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Stakeholder) => (
        <Space>
          {can('MANAGER_AND_ABOVE') && (
            <Button type="link" icon={<EditOutlined />} size="small"
              onClick={() => openStakeholderModal(record)}>Edit</Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Popconfirm title="Delete this stakeholder?" onConfirm={() => handleDeleteStakeholder(record.id)}
              okText="Yes" cancelText="No">
              <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const commColumns = [
    {
      title: 'Stakeholder',
      dataIndex: 'stakeholderId',
      key: 'stakeholderId',
      render: (id: string) => {
        const s = stakeholders.find(sh => sh.id === id);
        return s ? s.name : id || '—';
      },
    },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', render: (v: string) => v || '—' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => v ? <Tag>{v.replace(/_/g, ' ')}</Tag> : '—' },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => v ? new Date(v).toLocaleDateString() : '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Communication) => (
        <Space>
          {can('ENGINEER_AND_ABOVE') && (
            <Button type="link" icon={<EditOutlined />} size="small"
              onClick={() => openCommModal(record)}>Edit</Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Popconfirm title="Delete this communication?" onConfirm={() => handleDeleteComm(record.id)}
              okText="Yes" cancelText="No">
              <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const shTabItems = [
    { key: 'register',       icon: <TeamOutlined />,    label: 'Register'          },
    { key: 'communications', icon: <MessageOutlined />, label: 'Communications'    },
    { key: 'engagement',     icon: null,                label: 'Engagement'        },
    { key: 'matrix',         icon: null,                label: 'Influence Matrix'  },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <Title level={2} style={{ marginBottom: 4 }}>Stakeholders</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Manage people and groups involved in the project: register contacts, log communications, and track engagement.</Text>
          </div>

          <div style={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 8, padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#9ca3af' }}>Project</Text>
              <ProjectSelector />
            </div>
            <Button icon={<ReloadOutlined />} onClick={loadData}>Refresh</Button>
          </div>

          {!selectedProject && !projectsLoading && (
            <Alert
              message="Choose a project first"
              description="Select a project above to add stakeholders, log communications, and view the influence matrix."
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
                  {shTabItems.map(tab => (
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

                {/* Register */}
                {activeTab === 'register' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>People and organizations with an interest in the project.</Text>
                      {can('MANAGER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => openStakeholderModal()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add stakeholder
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={stakeholderColumns}
                      dataSource={stakeholders}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} stakeholder${t !== 1 ? 's' : ''}` }}
                      size="small"
                      locale={{ emptyText: 'No stakeholders yet. Click "Add stakeholder" to add contacts (e.g. client, suppliers, team).' }}
                    />
                  </>
                )}

                {/* Communications */}
                {activeTab === 'communications' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Record meetings, emails, and other interactions with stakeholders.</Text>
                      <Button icon={<PlusOutlined />} onClick={() => openCommModal()}
                        style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                        Log communication
                      </Button>
                    </div>
                    <Table
                      columns={commColumns}
                      dataSource={communications}
                      rowKey="id"
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} communication${t !== 1 ? 's' : ''}` }}
                      size="small"
                      locale={{ emptyText: 'No communications logged. Click "Log communication" to record a meeting, email, or call.' }}
                    />
                  </>
                )}

                {/* Engagement */}
                {activeTab === 'engagement' && (
                  <div style={{ padding: 16 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>Track how supportive each stakeholder is and record feedback over time.</Text>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Card title="Record engagement" size="small">
                          <Form form={engagementForm} layout="vertical">
                            <Form.Item label="Stakeholder" required>
                              <Select
                                placeholder="Select a stakeholder"
                                value={selectedStakeholderForEng || undefined}
                                onChange={v => { setSelectedStakeholderForEng(v); loadEngagement(v); }}
                                style={{ width: '100%' }}
                              >
                                {stakeholders.map(s => (
                                  <Option key={s.id} value={s.id}>{s.name}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item name="engagementLevel" label="Engagement level" rules={[{ required: true, message: 'Select a level' }]} tooltip="Unaware → Resistant → Neutral → Supportive → Leading">
                              <Select placeholder="Select level">
                                <Option value="UNAWARE">Unaware</Option>
                                <Option value="RESISTANT">Resistant</Option>
                                <Option value="NEUTRAL">Neutral</Option>
                                <Option value="SUPPORTIVE">Supportive</Option>
                                <Option value="LEADING">Leading</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item name="notes" label="Notes">
                              <TextArea rows={2} />
                            </Form.Item>
                            {can('ENGINEER_AND_ABOVE') && (
                              <Button type="primary" onClick={handleEngagementSubmit}
                                loading={engagementSubmitting}>Save Engagement</Button>
                            )}
                          </Form>
                        </Card>

                        <Card title="Record feedback" size="small" style={{ marginTop: 16 }}>
                          <Form form={feedbackForm} layout="vertical">
                            <Form.Item name="feedback" label="Comments" rules={[{ required: true, message: 'Enter feedback' }]}>
                              <TextArea rows={3} placeholder="What did the stakeholder say or request?" />
                            </Form.Item>
                            <Form.Item name="rating" label="Rating (1–5)" tooltip="Optional satisfaction score">
                              <Select placeholder="Optional">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Option key={n} value={n}>{n} {n === 1 ? '— Poor' : n === 5 ? '— Excellent' : ''}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Button type="primary" onClick={handleFeedbackSubmit} loading={feedbackSubmitting}>
                              Save feedback
                            </Button>
                          </Form>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card title="Engagement history" size="small" style={{ maxHeight: 520, overflowY: 'auto' }}>
                          {!selectedStakeholderForEng ? (
                            <Empty description="Select a stakeholder above to see their engagement history" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          ) : (
                            <List
                              size="small"
                              dataSource={engagementMap[selectedStakeholderForEng] || []}
                              locale={{ emptyText: 'No engagement records yet' }}
                              renderItem={(item: any) => (
                                <List.Item>
                                  <div>
                                    <Tag color="blue">{item.engagementLevel ? item.engagementLevel.charAt(0) + item.engagementLevel.slice(1).toLowerCase() : 'Recorded'}</Tag>
                                    {item.notes && (
                                      <Text type="secondary" style={{ marginLeft: 8 }}>{item.notes}</Text>
                                    )}
                                    {item.date && (
                                      <div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                          {new Date(item.date).toLocaleDateString()}
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                </List.Item>
                              )}
                            />
                          )}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Influence Matrix */}
                {activeTab === 'matrix' && (
                  <div style={{ padding: 16 }}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>Stakeholders plotted by influence (power) and interest. Use this to prioritize who to engage and how.</Text>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={16}>
                        <Card title="Power vs interest" size="small">
                          {matrixPoints.length === 0 ? (
                            <Empty description="Add stakeholders with Influence and Interest set to see the matrix" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          ) : (
                            <ChartErrorBoundary height={380}>
                              <ResponsiveContainer width="100%" height={380}>
                                <ScatterChart margin={{ top: 30, right: 30, bottom: 40, left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" dataKey="x" domain={[0, 10]} ticks={[2, 5, 8]} tick={{ fill: '#aaa' }} stroke="#555">
                                  <Label value="Interest →" fill="#aaa" position="insideBottom" offset={-20} />
                                </XAxis>
                                <YAxis type="number" dataKey="y" domain={[0, 10]} ticks={[2, 5, 8]} tick={{ fill: '#aaa' }} stroke="#555">
                                  <Label value="Influence →" fill="#aaa" angle={-90} position="insideLeft" offset={20} />
                                </YAxis>
                                <Tooltip
                                  cursor={{ strokeDasharray: '3 3' }}
                                  content={({ payload }) => {
                                    if (payload && payload.length) {
                                      const d = payload[0].payload;
                                      return (
                                        <div style={{ background: '#1f1f1f', border: '1px solid #333', padding: '8px 12px', borderRadius: 4, maxWidth: 220 }}>
                                          <strong style={{ color: '#fff' }}>{d.name}</strong>
                                          {d.strategy && <div style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>{d.strategy}</div>}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <ReferenceLine x={3.5} stroke="#555" strokeDasharray="4 4" />
                                <ReferenceLine x={6.5} stroke="#555" strokeDasharray="4 4" />
                                <ReferenceLine y={3.5} stroke="#555" strokeDasharray="4 4" />
                                <ReferenceLine y={6.5} stroke="#555" strokeDasharray="4 4" />
                                <Scatter data={matrixPoints} shape={(props: any) => {
                                  const { cx, cy, payload } = props;
                                  return (
                                    <g>
                                      <circle cx={cx} cy={cy} r={8} fill="#009944" fillOpacity={0.8} stroke="#00ff88" strokeWidth={1} />
                                      <text x={cx} y={cy - 12} textAnchor="middle" fill="#ccc" fontSize={11}>{payload.name}</text>
                                    </g>
                                  );
                                }} />
                                </ScatterChart>
                              </ResponsiveContainer>
                            </ChartErrorBoundary>
                          )}
                        </Card>
                      </Col>

                      <Col xs={24} lg={8}>
                        <Card title="Influence × Interest Grid" size="small" bodyStyle={{ padding: 0 }}>
                          {influenceMatrix?.matrix ? (() => {
                            const levels = ['HIGH', 'MEDIUM', 'LOW'];
                            const quadColors: Record<string, string> = {
                              HIGH_HIGH: '#ff4d4f', HIGH_MEDIUM: '#fa8c16', HIGH_LOW: '#fa8c16',
                              MEDIUM_HIGH: '#1890ff', MEDIUM_MEDIUM: '#8c8c8c', MEDIUM_LOW: '#8c8c8c',
                              LOW_HIGH: '#1890ff', LOW_MEDIUM: '#8c8c8c', LOW_LOW: '#8c8c8c',
                            };
                            return (
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '6px 8px', background: '#2a2a2a', color: '#aaa', fontSize: 11, textAlign: 'center', border: '1px solid #333' }}>Inf ↓ / Int →</th>
                                    {['LOW', 'MEDIUM', 'HIGH'].map(i => (
                                      <th key={i} style={{ padding: '6px 8px', background: '#2a2a2a', color: '#e2e8f0', fontSize: 11, textAlign: 'center', border: '1px solid #333' }}>{i}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {levels.map(inf => (
                                    <tr key={inf}>
                                      <td style={{ padding: '6px 8px', background: '#2a2a2a', color: '#e2e8f0', fontSize: 11, fontWeight: 600, border: '1px solid #333', textAlign: 'center' }}>{inf}</td>
                                      {['LOW', 'MEDIUM', 'HIGH'].map(int => {
                                        const key = `${inf}_${int}`;
                                        const cell = influenceMatrix.matrix[key];
                                        const bg = quadColors[key] || '#8c8c8c';
                                        return (
                                          <td key={int} style={{ padding: '6px 8px', border: '1px solid #333', verticalAlign: 'top', background: 'transparent' }}>
                                            <div style={{ fontSize: 10, color: bg, fontWeight: 600, marginBottom: 2 }}>
                                              {cell?.count ? `${cell.count} stakeholder${cell.count > 1 ? 's' : ''}` : '—'}
                                            </div>
                                            {(cell?.stakeholders || []).map((s: any) => (
                                              <div key={s.id} style={{ fontSize: 10, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }} title={s.name}>
                                                {s.name}
                                              </div>
                                            ))}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            );
                          })() : <Empty description="No data" />}
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}

              </div>
            </Spin>
          )}
        </div>

        {/* ── Quick Stats sidebar ── */}
          <div style={{ width: isMobile ? '100%' : 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, marginTop: isMobile ? 0 : 88 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Stats
            </Text>
            {[
              { icon: <TeamOutlined />,       iconBg: '#2a2a2a',                iconColor: '#ffffff', label: 'Total Stakeholders', value: summary?.total ?? stakeholders.length,    valueColor: '#ffffff' },
              { icon: <StarOutlined />,        iconBg: 'rgba(0,153,68,0.12)',   iconColor: '#009944', label: 'Key Stakeholders',   value: summary?.keyStakeholders ?? 0,            valueColor: '#009944' },
              { icon: <PercentageOutlined />,  iconBg: 'rgba(255,170,0,0.12)', iconColor: '#ffaa00', label: 'Engagement Rate',    value: `${summary?.engagementRate ?? 0}%`,       valueColor: '#ffaa00' },
            ].map((stat, i) => (
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

      {/* Stakeholder Modal */}
      <Modal
        title={editingStakeholder ? 'Edit stakeholder' : 'Add stakeholder'}
        open={stakeholderModalVisible}
        onOk={handleStakeholderSubmit}
        onCancel={() => setStakeholderModalVisible(false)}
        width={520}
        okText={editingStakeholder ? 'Save changes' : 'Add stakeholder'}
      >
        <Form form={stakeholderForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter name' }]}>
            <Input placeholder="Full name or company name" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="organization" label="Organization">
                <Input placeholder="Company or group" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Role">
                <Input placeholder="e.g. Client, Supplier" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" type="email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="Phone number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="influence" label="Influence" tooltip="How much they can affect the project">
                <Select placeholder="High / Medium / Low">
                  <Option value="HIGH">High</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="LOW">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="interest" label="Interest" tooltip="How much they care about the outcome">
                <Select placeholder="High / Medium / Low">
                  <Option value="HIGH">High</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="LOW">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="Type">
                <Select placeholder="Internal or external">
                  <Option value="INTERNAL">Internal</Option>
                  <Option value="EXTERNAL">External</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Communication Modal */}
      <Modal
        title={editingComm ? 'Edit communication' : 'Log communication'}
        open={commModalVisible}
        onOk={handleCommSubmit}
        onCancel={() => setCommModalVisible(false)}
        okText={editingComm ? 'Save changes' : 'Log communication'}
      >
        <Form form={commForm} layout="vertical">
          {!editingComm && (
            <Form.Item label="Stakeholder" required>
              <Select
                placeholder="Who did you communicate with?"
                value={selectedStakeholderForComm || undefined}
                onChange={setSelectedStakeholderForComm}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
              >
                {stakeholders.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}{s.organization ? ` (${s.organization})` : ''}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="subject" label="Subject">
            <Input placeholder="e.g. Weekly sync, Budget review" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Select type' }]}>
            <Select placeholder="How did you communicate?">
              <Option value="EMAIL">Email</Option>
              <Option value="MEETING">Meeting</Option>
              <Option value="PHONE_CALL">Phone call</Option>
              <Option value="REPORT">Report</Option>
              <Option value="SITE_VISIT">Site visit</Option>
              <Option value="LETTER">Letter</Option>
            </Select>
          </Form.Item>
          <Form.Item name="message" label="Notes (optional)">
            <TextArea rows={3} placeholder="Key points or summary" />
          </Form.Item>
          <Form.Item name="date" label="Date">
            <DatePicker style={{ width: '100%' }} placeholder="When did this happen?" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectStakeholders;
