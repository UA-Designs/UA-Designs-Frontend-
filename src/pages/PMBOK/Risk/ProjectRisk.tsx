import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Table,
  Tag,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Statistic,
  Progress,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  RiseOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { useProject } from '../../../contexts/ProjectContext';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import { User } from '../../../types';
import {
  riskService,
  Risk,
  Mitigation,
  RiskSeverity,
  RiskStatus,
  MitigationStatus,
  EscalationLevel,
  RiskMatrix as RiskMatrixType,
  RiskMonitoring as RiskMonitoringType,
} from '../../../services/riskService';
import RiskMatrix from '../../../components/Charts/RiskMatrix';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProjectRisk: React.FC = () => {
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const { can } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('risks');

  // Data states
  const [risks, setRisks] = useState<Risk[]>([]);
  const [mitigations, setMitigations] = useState<Mitigation[]>([]);
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrixType | null>(null);
  const [monitoring, setMonitoring] = useState<RiskMonitoringType | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Modal states
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [mitigationModalVisible, setMitigationModalVisible] = useState(false);
  const [escalateModalVisible, setEscalateModalVisible] = useState(false);
  const [assessModalVisible, setAssessModalVisible] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  // Forms
  const [riskForm] = Form.useForm();
  const [mitigationForm] = Form.useForm();
  const [escalateForm] = Form.useForm();
  const [assessForm] = Form.useForm();

  useEffect(() => {
    authService.getUsers().then(u => setUsers(Array.isArray(u) ? u : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProject) {
      // Clear stale data when switching projects
      setRisks([]);
      setMitigations([]);
      setRiskMatrix(null);
      setMonitoring(null);
      loadRiskData();
    }
  }, [selectedProject]);



  const loadRiskData = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const [risksData, mitigationsData, matrixData, monitoringData] = await Promise.allSettled([
        riskService.getRisks(selectedProject.id),
        riskService.getMitigations(selectedProject.id),
        riskService.getRiskMatrix(selectedProject.id),
        riskService.getRiskMonitoring(selectedProject.id),
      ]);

      if (risksData.status === 'fulfilled') setRisks(risksData.value.risks);
      if (mitigationsData.status === 'fulfilled') setMitigations(mitigationsData.value.mitigations);
      if (matrixData.status === 'fulfilled' && matrixData.value) setRiskMatrix(matrixData.value);
      if (monitoringData.status === 'fulfilled' && monitoringData.value) setMonitoring(monitoringData.value);
    } catch (error: any) {
      console.error('Error loading risk data:', error);
      message.error('Failed to load risk data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRiskData();
  };

  const handleAddRisk = () => {
    setEditingRisk(null);
    riskForm.resetFields();
    setRiskModalVisible(true);
  };

  const handleEditRisk = (risk: Risk) => {
    setEditingRisk(risk);
    riskForm.setFieldsValue({
      title: risk.title,
      description: risk.description,
      status: risk.status,
      severity: risk.severity,
      probability: risk.probability,
      impact: risk.impact,
      responseStrategy: risk.responseStrategy,
    });
    setRiskModalVisible(true);
  };

  const handleDeleteRisk = async (riskId: string) => {
    Modal.confirm({
      title: 'Delete Risk',
      content: 'Are you sure you want to delete this risk? This will also delete all associated mitigations.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await riskService.deleteRisk(riskId);
          message.success('Risk deleted successfully');
          loadRiskData();
        } catch (error: any) {
          message.error(error.message || 'Failed to delete risk');
        }
      },
    });
  };

  const handleRiskSubmit = async () => {
    try {
      const values = await riskForm.validateFields();
      const riskData: any = {
        title: values.title,
        description: values.description,
        probability: values.probability,
        impact: values.impact,
        status: values.status,
        severity: values.severity,
        responseStrategy: values.responseStrategy,
        projectId: selectedProject?.id,
      };

      if (editingRisk) {
        await riskService.updateRisk(editingRisk.id, riskData);
        message.success('Risk updated successfully');
      } else {
        await riskService.createRisk(riskData);
        message.success('Risk created successfully');
      }

      setRiskModalVisible(false);
      riskForm.resetFields();
      loadRiskData();
    } catch (error: any) {
      message.error(error.message || 'Failed to save risk');
    }
  };

  const handleAssessRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    assessForm.setFieldsValue({
      residualProbability: risk.residualProbability || risk.probability,
      residualImpact: risk.residualImpact || risk.impact,
    });
    setAssessModalVisible(true);
  };

  const handleAssessSubmit = async () => {
    try {
      const values = await assessForm.validateFields();
      if (!selectedRisk) return;

      await riskService.assessRisk(selectedRisk.id, values.residualProbability, values.residualImpact);
      message.success('Risk assessed successfully');
      setAssessModalVisible(false);
      assessForm.resetFields();
      loadRiskData();
    } catch (error: any) {
      message.error(error.message || 'Failed to assess risk');
    }
  };

  const handleEscalateRisk = (risk: Risk) => {
    setSelectedRisk(risk);
    escalateForm.resetFields();
    setEscalateModalVisible(true);
  };

  const handleEscalateSubmit = async () => {
    try {
      const values = await escalateForm.validateFields();
      if (!selectedRisk) return;

      await riskService.escalateRisk(selectedRisk.id, values.level, values.reason);
      message.success('Risk escalated successfully');
      setEscalateModalVisible(false);
      escalateForm.resetFields();
      loadRiskData();
    } catch (error: any) {
      message.error(error.message || 'Failed to escalate risk');
    }
  };

  const handleAddMitigation = (risk?: Risk) => {
    if (risk) {
      mitigationForm.setFieldsValue({ riskId: risk.id });
      setSelectedRisk(risk);
    } else {
      mitigationForm.resetFields();
    }
    setMitigationModalVisible(true);
  };

  const handleMitigationSubmit = async () => {
    try {
      const values = await mitigationForm.validateFields();

      const mitigationData = {
        ...values,
        startDate: values.startDate?.toISOString(),
        targetDate: values.targetDate?.toISOString(),
      };

      await riskService.createMitigation(mitigationData);
      message.success('Mitigation created successfully');
      setMitigationModalVisible(false);
      mitigationForm.resetFields();
      loadRiskData();
    } catch (error: any) {
      message.error(error.message || 'Failed to create mitigation');
    }
  };

  const handleDeleteMitigation = async (mitigationId: string) => {
    try {
      await riskService.deleteMitigation(mitigationId);
      message.success('Mitigation deleted successfully');
      loadRiskData();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete mitigation');
    }
  };

  // Helper functions — API returns decimals (0.1, 0.25, 0.5, 0.75, 1.0)
  const getDecimalLabel = (val: number): string => {
    if (val <= 0.1) return 'Very Low';
    if (val <= 0.25) return 'Low';
    if (val <= 0.5) return 'Medium';
    if (val <= 0.75) return 'High';
    return 'Very High';
  };

  const getDecimalColor = (val: number): string => {
    if (val <= 0.25) return 'green';
    if (val <= 0.5) return 'orange';
    return 'red';
  };

  const getProbabilityLabel = (prob: number): string => getDecimalLabel(prob);
  const getImpactLabel = (impact: number): string => getDecimalLabel(impact);

  const getSeverityColor = (severity: RiskSeverity): string => {
    const colors = {
      [RiskSeverity.LOW]: 'green',
      [RiskSeverity.MEDIUM]: 'orange',
      [RiskSeverity.HIGH]: 'red',
      [RiskSeverity.CRITICAL]: 'purple',
    };
    return colors[severity] || 'default';
  };

  const getStatusColor = (status: RiskStatus): string => {
    const colors = {
      [RiskStatus.IDENTIFIED]: 'blue',
      [RiskStatus.ANALYZED]: 'cyan',
      [RiskStatus.MITIGATING]: 'green',
      [RiskStatus.MONITORING]: 'orange',
      [RiskStatus.CLOSED]: 'default',
      [RiskStatus.ESCALATED]: 'red',
    };
    return colors[status] || 'default';
  };

  // Calculate statistics
  const safeRisks = Array.isArray(risks) ? risks : [];
  const safeMitigations = Array.isArray(mitigations) ? mitigations : [];

  const criticalRisks = safeRisks.filter(r => r.severity === RiskSeverity.CRITICAL).length;
  const highRisks = safeRisks.filter(r => r.severity === RiskSeverity.HIGH).length;
  const activeRisks = safeRisks.filter(r => r.status !== RiskStatus.CLOSED).length;
  const mitigatedRisks = safeRisks.filter(r => r.status === RiskStatus.MITIGATING || r.status === RiskStatus.MONITORING).length;

  const riskColumns = [
    {
      title: 'Risk',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Risk) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description.substring(0, 60)}...</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (_: any, record: Risk) => {
        const cat = (record as any).riskCategory || (record as any).category;
        return <Tag color={cat?.color || 'blue'}>{cat?.name || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob: number) => (
        <Tag color={getDecimalColor(prob)}>{getProbabilityLabel(prob)}</Tag>
      ),
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: number) => (
        <Tag color={getDecimalColor(impact)}>{getImpactLabel(impact)}</Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      sorter: (a: Risk, b: Risk) => a.riskScore - b.riskScore,
      render: (score: number) => (
        <Badge count={score} style={{ backgroundColor: score >= 15 ? '#f5222d' : score >= 9 ? '#faad14' : '#52c41a' }} />
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: RiskSeverity) => (
        <Tag color={getSeverityColor(severity)}>{severity}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: RiskStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Risk) => (
        <Space size="small">
          {can('ENGINEER_AND_ABOVE') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditRisk(record)}
            >
              Edit
            </Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAssessRisk(record)}
            >
              Assess
            </Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAddMitigation(record)}
            >
              Mitigate
            </Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleEscalateRisk(record)}
            >
              Escalate
            </Button>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRisk(record.id)}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const mitigationColumns = [
    {
      title: 'Risk',
      key: 'risk',
      render: (_: any, record: Mitigation) => {
        const risk = safeRisks.find(r => r.id === record.riskId);
        return risk?.title || 'Unknown Risk';
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string, record: Mitigation) => (
        <Space direction="vertical" size={0}>
          <Text strong>{action}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description.substring(0, 50)}...</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: MitigationStatus) => {
        const colors = {
          [MitigationStatus.PLANNED]: 'blue',
          [MitigationStatus.IN_PROGRESS]: 'orange',
          [MitigationStatus.COMPLETED]: 'green',
          [MitigationStatus.CANCELLED]: 'red',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Target Date',
      dataIndex: 'targetDate',
      key: 'targetDate',
      render: (date: string) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Cost',
      key: 'cost',
      render: (_: any, record: Mitigation) => (
        <Text>
          ${record.actualCost || record.estimatedCost || 0}
        </Text>
      ),
    },
    {
      title: 'Effectiveness',
      dataIndex: 'effectiveness',
      key: 'effectiveness',
      render: (effectiveness: string) => {
        if (!effectiveness) return '-';
        const colors: Record<string, string> = { LOW: 'orange', MEDIUM: 'blue', HIGH: 'green' };
        return <Tag color={colors[effectiveness] || 'default'}>{effectiveness}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Mitigation) => (
        can('MANAGER_AND_ABOVE') ? (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleDeleteMitigation(record.id)}
          >
            Delete
          </Button>
        ) : null
      ),
    },
  ];

  const riskTabItems = [
    { key: 'risks',       icon: <SafetyOutlined />,     label: 'Risks'       },
    { key: 'mitigations', icon: <CheckCircleOutlined />, label: 'Mitigations' },
    { key: 'matrix',      icon: <DashboardOutlined />,   label: 'Risk Matrix' },
    { key: 'overview',    icon: <FileTextOutlined />,    label: 'Overview'    },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <Title level={2} style={{ marginBottom: 4 }}>Project Risk Management</Title>
            <Text type="secondary">Identify, analyze, and manage project risks</Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Risk Management</Title>
            <Button
              icon={<ReloadOutlined style={{ color: '#009944' }} />}
              onClick={handleRefresh}
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
              description={<span style={{ color: '#94a3b8' }}>Please select a project from the dropdown above to manage its risks, mitigation strategies, and contingency plans.</span>}
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

              {/* Monitoring Summary Card */}
              {monitoring && monitoring.summary && (
                <Card title="Risk Monitoring Summary" style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={12} md={6}>
                      <Statistic title="Total" value={monitoring.summary.total ?? 0} valueStyle={{ color: '#1890ff' }} />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic title="Open" value={monitoring.summary.open ?? 0} valueStyle={{ color: '#faad14' }} />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic title="Closed" value={monitoring.summary.closed ?? 0} valueStyle={{ color: '#52c41a' }} />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic title="Open/Closed Ratio" value={monitoring.summary.openClosedRatio ?? '0.00'} />
                    </Col>
                  </Row>
                </Card>
              )}

              {/* Custom tab nav */}
              <div style={{ borderBottom: '1px solid #333333' }}>
                <div style={{ display: 'flex' }}>
                  {riskTabItems.map(tab => (
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

                {/* Risks */}
                {activeTab === 'risks' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('ENGINEER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={handleAddRisk}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Risk
                        </Button>
                      )}
                    </div>
                    <Table columns={riskColumns} dataSource={safeRisks} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 1400 }} />
                  </>
                )}

                {/* Mitigations */}
                {activeTab === 'mitigations' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('MANAGER_AND_ABOVE') && (
                        <Button icon={<PlusOutlined />} onClick={() => handleAddMitigation()}
                          style={{ background: '#00aaff', borderColor: '#00aaff', color: '#ffffff' }}>
                          Add Mitigation
                        </Button>
                      )}
                    </div>
                    <Table columns={mitigationColumns} dataSource={safeMitigations} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 1000 }} />
                  </>
                )}

                {/* Risk Matrix */}
                {activeTab === 'matrix' && (
                  <div style={{ padding: 16 }}>
                    {riskMatrix && <RiskMatrix data={riskMatrix} />}
                    {!riskMatrix && <Alert message="No risk matrix data available" type="info" />}
                  </div>
                )}

                {/* Overview */}
                {activeTab === 'overview' && (
                  <div style={{ padding: 16 }}>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Card title="Risk Distribution by Severity">
                          <Space direction="vertical" style={{ width: '100%' }}>
                            {monitoring && Object.entries(monitoring.bySeverity || {}).map(([severity, count]) => (
                              <div key={severity}>
                                <Text>{severity}: {count as number}</Text>
                                <Progress
                                  percent={monitoring.summary.total > 0 ? ((count as number) / monitoring.summary.total) * 100 : 0}
                                  strokeColor={getSeverityColor(severity as RiskSeverity)}
                                  showInfo={false}
                                />
                              </div>
                            ))}
                          </Space>
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card title="Top Risks">
                          {monitoring?.topRisks && monitoring.topRisks.length > 0 ? (
                            monitoring.topRisks.map((risk, index) => (
                              <div key={risk.id} style={{ marginBottom: 12 }}>
                                <Badge count={index + 1} style={{ marginRight: 8 }} />
                                <Text strong>{risk.title}</Text>
                                <Tag color={getSeverityColor(risk.severity as RiskSeverity)} style={{ marginLeft: 8 }}>
                                  Score: {risk.riskScore}
                                </Tag>
                              </div>
                            ))
                          ) : (
                            <Text type="secondary">No high-risk items</Text>
                          )}
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
              { icon: <ExclamationCircleOutlined />, iconBg: 'rgba(0,170,255,0.12)',  iconColor: '#00aaff', label: 'Total Risks',    value: safeRisks.length,          valueColor: '#00aaff' },
              { icon: <WarningOutlined />,           iconBg: 'rgba(255,0,64,0.12)',   iconColor: '#ff0040', label: 'Critical/High',  value: criticalRisks + highRisks, valueColor: '#ff0040' },
              { icon: <RiseOutlined />,              iconBg: 'rgba(255,170,0,0.12)',  iconColor: '#ffaa00', label: 'Active Risks',   value: activeRisks,               valueColor: '#ffaa00' },
              { icon: <CheckCircleOutlined />,       iconBg: 'rgba(0,153,68,0.12)',   iconColor: '#009944', label: 'Mitigated',      value: mitigatedRisks,            valueColor: '#009944' },
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

      {/* Risk Modal */}
      <Modal
        title={editingRisk ? 'Edit Risk' : 'Create Risk'}
        open={riskModalVisible}
        onOk={handleRiskSubmit}
        onCancel={() => {
          setRiskModalVisible(false);
          riskForm.resetFields();
        }}
        width={700}
      >
        <Form form={riskForm} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter risk title' }]}
          >
            <Input placeholder="Enter risk title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Describe the risk" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  {Object.values(RiskStatus).map(status => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="Severity">
                <Select placeholder="Select severity" allowClear>
                  {Object.values(RiskSeverity).map(s => (
                    <Option key={s} value={s}>{s}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="probability"
                label="Probability"
                rules={[{ required: true, message: 'Please select probability' }]}
              >
                <Select placeholder="Select probability">
                  <Option value={0.1}>Very Low</Option>
                  <Option value={0.25}>Low</Option>
                  <Option value={0.5}>Medium</Option>
                  <Option value={0.75}>High</Option>
                  <Option value={1.0}>Very High</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="impact"
                label="Impact"
                rules={[{ required: true, message: 'Please select impact' }]}
              >
                <Select placeholder="Select impact">
                  <Option value={0.1}>Very Low</Option>
                  <Option value={0.25}>Low</Option>
                  <Option value={0.5}>Medium</Option>
                  <Option value={0.75}>High</Option>
                  <Option value={1.0}>Very High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="responseStrategy" label="Response Strategy">
            <Select placeholder="Select response strategy" allowClear>
              <Option value="AVOID">Avoid</Option>
              <Option value="MITIGATE">Mitigate</Option>
              <Option value="TRANSFER">Transfer</Option>
              <Option value="ACCEPT">Accept</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assess Risk Modal */}
      <Modal
        title="Assess Risk"
        open={assessModalVisible}
        onOk={handleAssessSubmit}
        onCancel={() => {
          setAssessModalVisible(false);
          assessForm.resetFields();
        }}
      >
        <Form form={assessForm} layout="vertical">
          <Form.Item
            name="residualProbability"
            label="Residual Probability"
            rules={[{ required: true, message: 'Please select residual probability' }]}
          >
            <Select placeholder="Select residual probability">
              <Option value={0.1}>Very Low</Option>
              <Option value={0.25}>Low</Option>
              <Option value={0.5}>Medium</Option>
              <Option value={0.75}>High</Option>
              <Option value={1.0}>Very High</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="residualImpact"
            label="Residual Impact"
            rules={[{ required: true, message: 'Please select residual impact' }]}
          >
            <Select placeholder="Select residual impact">
              <Option value={0.1}>Very Low</Option>
              <Option value={0.25}>Low</Option>
              <Option value={0.5}>Medium</Option>
              <Option value={0.75}>High</Option>
              <Option value={1.0}>Very High</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Escalate Risk Modal */}
      <Modal
        title="Escalate Risk"
        open={escalateModalVisible}
        onOk={handleEscalateSubmit}
        onCancel={() => {
          setEscalateModalVisible(false);
          escalateForm.resetFields();
        }}
      >
        <Form form={escalateForm} layout="vertical">
          <Form.Item
            name="level"
            label="Escalation Level"
            rules={[{ required: true, message: 'Please select escalation level' }]}
          >
            <Select placeholder="Select level">
              {Object.values(EscalationLevel).map(level => (
                <Option key={level} value={level}>{level}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter escalation reason' }]}
          >
            <TextArea rows={4} placeholder="Explain why this risk needs escalation" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Mitigation Modal */}
      <Modal
        title="Create Mitigation Action"
        open={mitigationModalVisible}
        onOk={handleMitigationSubmit}
        onCancel={() => {
          setMitigationModalVisible(false);
          mitigationForm.resetFields();
        }}
        width={600}
      >
        <Form form={mitigationForm} layout="vertical">
          <Form.Item
            name="riskId"
            label="Risk"
            rules={[{ required: true, message: 'Please select risk' }]}
          >
            <Select placeholder="Select risk">
              {safeRisks.map(risk => (
                <Option key={risk.id} value={risk.id}>{risk.title}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: 'Please enter action' }]}
          >
            <Input placeholder="Enter mitigation action" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Describe the mitigation action" />
          </Form.Item>

          <Form.Item
            name="strategy"
            label="Strategy"
            rules={[{ required: true, message: 'Please enter strategy' }]}
          >
            <TextArea rows={2} placeholder="Describe the mitigation strategy" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              {Object.values(MitigationStatus).map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetDate" label="Target Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimatedCost" label="Estimated Cost (₱)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="effectiveness" label="Effectiveness">
                <Select placeholder="Select effectiveness" allowClear>
                  <Option value="LOW">Low</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="HIGH">High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assignedToId" label="Assigned To">
            <Select placeholder="Select assignee (optional)" allowClear showSearch
              optionFilterProp="label"
              options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProjectRisk;
