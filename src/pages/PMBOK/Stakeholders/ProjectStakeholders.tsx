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
  message,
  Spin,
  Popconfirm,
  Space,
  Empty,
  List,
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

// ---- Helpers ----

const influenceColor = (level: string) =>
  level === 'High' ? 'red' : level === 'Medium' ? 'orange' : 'green';

// ---- Component ----

const ProjectStakeholders: React.FC = () => {
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const { can } = useAuth();
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

  const matrixPoints = React.useMemo(() => {
    if (!influenceMatrix) return [];
    const list: any[] = influenceMatrix.stakeholders || influenceMatrix.data || [];
    return list.map((s: any) => ({
      name: s.name,
      x: typeof s.interest === 'number' ? s.interest : 5,
      y: typeof s.influence === 'number' ? s.influence : 5,
    }));
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
      render: (v: string) => v ? <Tag color={v === 'Internal' ? 'blue' : 'purple'}>{v}</Tag> : '—',
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
    { title: 'Channel', dataIndex: 'channel', key: 'channel', render: (v: string) => v ? <Tag>{v}</Tag> : '—' },
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
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <Title level={2} style={{ marginBottom: 4 }}>Project Stakeholder Management</Title>
            <Text type="secondary">Identify, analyze, and engage project stakeholders</Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Stakeholder Management</Title>
            <Button
              icon={<ReloadOutlined style={{ color: '#009944' }} />}
              onClick={loadData}
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
              description={<span style={{ color: '#94a3b8' }}>Please select a project to manage its stakeholders, communications, and engagement strategies.</span>}
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
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('MANAGER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => openStakeholderModal()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Stakeholder
                        </Button>
                      )}
                    </div>
                    <Table columns={stakeholderColumns} dataSource={stakeholders} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
                  </>
                )}

                {/* Communications */}
                {activeTab === 'communications' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      <Button icon={<PlusOutlined />} onClick={() => openCommModal()}
                        style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                        Log Communication
                      </Button>
                    </div>
                    <Table columns={commColumns} dataSource={communications} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
                  </>
                )}

                {/* Engagement */}
                {activeTab === 'engagement' && (
                  <div style={{ padding: 16 }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Card title="Record Engagement" size="small">
                          <Form form={engagementForm} layout="vertical">
                            <Form.Item label="Stakeholder" required>
                              <Select
                                placeholder="Select stakeholder"
                                value={selectedStakeholderForEng || undefined}
                                onChange={v => { setSelectedStakeholderForEng(v); loadEngagement(v); }}
                                style={{ width: '100%' }}
                              >
                                {stakeholders.map(s => (
                                  <Option key={s.id} value={s.id}>{s.name}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item name="level" label="Engagement Level">
                              <Select placeholder="Select level">
                                <Option value="Unaware">Unaware</Option>
                                <Option value="Resistant">Resistant</Option>
                                <Option value="Neutral">Neutral</Option>
                                <Option value="Supportive">Supportive</Option>
                                <Option value="Leading">Leading</Option>
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

                        <Card title="Record Feedback" size="small" style={{ marginTop: 16 }}>
                          <Form form={feedbackForm} layout="vertical">
                            <Form.Item name="comments" label="Feedback Comments">
                              <TextArea rows={3} />
                            </Form.Item>
                            <Form.Item name="rating" label="Rating (1–5)">
                              <Select placeholder="Select rating">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Option key={n} value={n}>{n}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Button onClick={handleFeedbackSubmit} loading={feedbackSubmitting}>
                              Submit Feedback
                            </Button>
                          </Form>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card title="Engagement History" size="small" style={{ maxHeight: 520, overflowY: 'auto' }}>
                          {!selectedStakeholderForEng ? (
                            <Empty description="Select a stakeholder to view engagement history" />
                          ) : (
                            <List
                              size="small"
                              dataSource={engagementMap[selectedStakeholderForEng] || []}
                              locale={{ emptyText: 'No engagement records yet' }}
                              renderItem={(item: any) => (
                                <List.Item>
                                  <div>
                                    <Tag color="blue">{item.level || 'Recorded'}</Tag>
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
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={16}>
                        <Card title="Power vs Interest Matrix" size="small">
                          {matrixPoints.length === 0 ? (
                            <Empty description="No influence matrix data available" />
                          ) : (
                            <ResponsiveContainer width="100%" height={380}>
                              <ScatterChart margin={{ top: 30, right: 30, bottom: 40, left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" dataKey="x" domain={[0, 10]} tick={{ fill: '#aaa' }} stroke="#555">
                                  <Label value="Interest →" fill="#aaa" position="insideBottom" offset={-20} />
                                </XAxis>
                                <YAxis type="number" dataKey="y" domain={[0, 10]} tick={{ fill: '#aaa' }} stroke="#555">
                                  <Label value="Influence →" fill="#aaa" angle={-90} position="insideLeft" offset={20} />
                                </YAxis>
                                <Tooltip
                                  cursor={{ strokeDasharray: '3 3' }}
                                  content={({ payload }) => {
                                    if (payload && payload.length) {
                                      const d = payload[0].payload;
                                      return (
                                        <div style={{ background: '#1f1f1f', border: '1px solid #333', padding: '8px 12px', borderRadius: 4 }}>
                                          <strong style={{ color: '#fff' }}>{d.name}</strong>
                                          <div style={{ color: '#aaa', fontSize: 12 }}>
                                            Interest: {d.x} | Influence: {d.y}
                                          </div>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <ReferenceLine x={5} stroke="#555" strokeDasharray="4 4" />
                                <ReferenceLine y={5} stroke="#555" strokeDasharray="4 4" />
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
                          )}
                        </Card>
                      </Col>

                      <Col xs={24} lg={8}>
                        <Card title="Quadrant Guide" size="small">
                          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                              <Tag color="red">Manage Closely</Tag>
                              <div><Text type="secondary" style={{ fontSize: 12 }}>High Influence, High Interest</Text></div>
                            </div>
                            <div>
                              <Tag color="orange">Keep Satisfied</Tag>
                              <div><Text type="secondary" style={{ fontSize: 12 }}>High Influence, Low Interest</Text></div>
                            </div>
                            <div>
                              <Tag color="blue">Keep Informed</Tag>
                              <div><Text type="secondary" style={{ fontSize: 12 }}>Low Influence, High Interest</Text></div>
                            </div>
                            <div>
                              <Tag color="default">Monitor</Tag>
                              <div><Text type="secondary" style={{ fontSize: 12 }}>Low Influence, Low Interest</Text></div>
                            </div>
                          </Space>
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
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 88 }}>
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
        title={editingStakeholder ? 'Edit Stakeholder' : 'Add Stakeholder'}
        open={stakeholderModalVisible}
        onOk={handleStakeholderSubmit}
        onCancel={() => setStakeholderModalVisible(false)}
        width={520}
      >
        <Form form={stakeholderForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="organization" label="Organization"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Role"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="influence" label="Influence">
                <Select placeholder="Select">
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="interest" label="Interest">
                <Select placeholder="Select">
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="Type">
                <Select placeholder="Select">
                  <Option value="Internal">Internal</Option>
                  <Option value="External">External</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Communication Modal */}
      <Modal
        title={editingComm ? 'Edit Communication' : 'Log Communication'}
        open={commModalVisible}
        onOk={handleCommSubmit}
        onCancel={() => setCommModalVisible(false)}
      >
        <Form form={commForm} layout="vertical">
          {!editingComm && (
            <Form.Item label="Stakeholder" required>
              <Select
                placeholder="Select stakeholder"
                value={selectedStakeholderForComm || undefined}
                onChange={setSelectedStakeholderForComm}
                style={{ width: '100%' }}
              >
                {stakeholders.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="subject" label="Subject"><Input /></Form.Item>
          <Form.Item name="channel" label="Channel">
            <Select placeholder="Select channel">
              <Option value="Email">Email</Option>
              <Option value="Meeting">Meeting</Option>
              <Option value="Phone">Phone</Option>
              <Option value="Report">Report</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="message" label="Message"><TextArea rows={3} /></Form.Item>
          <Form.Item name="date" label="Date"><Input placeholder="YYYY-MM-DD" /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectStakeholders;
