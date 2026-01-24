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
  Tabs,
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
import ProjectSelector from '../../../components/common/ProjectSelector';
import { Project } from '../../../types';
import {
  riskService,
  Risk,
  Mitigation,
  RiskCategory,
  RiskProbability,
  RiskImpact,
  RiskSeverity,
  RiskStatus,
  MitigationStatus,
  EscalationLevel,
  RiskMatrix as RiskMatrixType,
  RiskMonitoring as RiskMonitoringType,
} from '../../../services/riskService';
import RiskMatrix from '../../../components/Charts/RiskMatrix';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ProjectRisk: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('risks');

  // Data states
  const [risks, setRisks] = useState<Risk[]>([]);
  const [mitigations, setMitigations] = useState<Mitigation[]>([]);
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrixType | null>(null);
  const [monitoring, setMonitoring] = useState<RiskMonitoringType | null>(null);

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
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadRiskData();
    }
  }, [selectedProject]);

  const handleProjectChange = (project: Project | null) => {
    setSelectedProject(project);
    if (!project) {
      // Reset data
      setRisks([]);
      setMitigations([]);
      setRiskMatrix(null);
      setMonitoring(null);
    }
  };

  const loadCategories = async () => {
    const categoriesData = await riskService.getCategories();
    setCategories(categoriesData);
  };

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
      ...risk,
      identifiedDate: risk.identifiedDate ? dayjs(risk.identifiedDate) : undefined,
      reviewDate: risk.reviewDate ? dayjs(risk.reviewDate) : undefined,
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

      const riskData = {
        ...values,
        projectId: selectedProject?.id,
        identifiedDate: values.identifiedDate?.toISOString(),
        reviewDate: values.reviewDate?.toISOString(),
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

  // Helper functions
  const getProbabilityLabel = (prob: RiskProbability): string => {
    const labels = {
      [RiskProbability.VERY_LOW]: 'Very Low',
      [RiskProbability.LOW]: 'Low',
      [RiskProbability.MEDIUM]: 'Medium',
      [RiskProbability.HIGH]: 'High',
      [RiskProbability.VERY_HIGH]: 'Very High',
    };
    return labels[prob] || 'Unknown';
  };

  const getImpactLabel = (impact: RiskImpact): string => {
    const labels = {
      [RiskImpact.VERY_LOW]: 'Very Low',
      [RiskImpact.LOW]: 'Low',
      [RiskImpact.MEDIUM]: 'Medium',
      [RiskImpact.HIGH]: 'High',
      [RiskImpact.VERY_HIGH]: 'Very High',
    };
    return labels[impact] || 'Unknown';
  };

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
      [RiskStatus.ASSESSED]: 'cyan',
      [RiskStatus.MITIGATED]: 'green',
      [RiskStatus.MONITORED]: 'orange',
      [RiskStatus.CLOSED]: 'default',
      [RiskStatus.ESCALATED]: 'red',
    };
    return colors[status] || 'default';
  };

  // Calculate statistics
  const safeRisks = Array.isArray(risks) ? risks : [];
  const safeMitigations = Array.isArray(mitigations) ? mitigations : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const criticalRisks = safeRisks.filter(r => r.severity === RiskSeverity.CRITICAL).length;
  const highRisks = safeRisks.filter(r => r.severity === RiskSeverity.HIGH).length;
  const activeRisks = safeRisks.filter(r => r.status !== RiskStatus.CLOSED).length;
  const mitigatedRisks = safeRisks.filter(r => r.status === RiskStatus.MITIGATED).length;

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
      dataIndex: 'category',
      key: 'category',
      render: (category: RiskCategory) => (
        <Tag color={category?.color || 'blue'}>{category?.name || 'Unknown'}</Tag>
      ),
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob: RiskProbability) => {
        const color = prob >= 4 ? 'red' : prob >= 3 ? 'orange' : 'green';
        return <Tag color={color}>{getProbabilityLabel(prob)}</Tag>;
      },
    },
    {
      title: 'Impact',
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: RiskImpact) => {
        const color = impact >= 4 ? 'red' : impact >= 3 ? 'orange' : 'green';
        return <Tag color={color}>{getImpactLabel(impact)}</Tag>;
      },
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
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRisk(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleAssessRisk(record)}
          >
            Assess
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleAddMitigation(record)}
          >
            Mitigate
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleEscalateRisk(record)}
          >
            Escalate
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRisk(record.id)}
          >
            Delete
          </Button>
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
      render: (effectiveness: number) =>
        effectiveness ? <Progress percent={effectiveness} size="small" /> : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Mitigation) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => handleDeleteMitigation(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Risk Management</Title>
        <Text type="secondary">
          Identify, analyze, and manage project risks
        </Text>
      </div>

      <ProjectSelector onProjectChange={handleProjectChange} />

      {!selectedProject && (
        <Alert
          message="No Project Selected"
          description="Please select a project from the dropdown above to manage its risks, mitigation strategies, and contingency plans."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {selectedProject && (
        <Spin spinning={loading}>
          {/* Summary Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Total Risks"
                  value={safeRisks.length}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Critical/High"
                  value={criticalRisks + highRisks}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Active Risks"
                  value={activeRisks}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Mitigated"
                  value={mitigatedRisks}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Monitoring Summary */}
          {monitoring && monitoring.summary && (
            <Card title="Risk Monitoring Summary" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Average Risk Score"
                    value={monitoring.summary.averageRiskScore?.toFixed(2) ?? '0.00'}
                    valueStyle={{
                      color: (monitoring.summary.averageRiskScore ?? 0) >= 15 ? '#ff4d4f' :
                             (monitoring.summary.averageRiskScore ?? 0) >= 9 ? '#faad14' : '#52c41a'
                    }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Trend"
                    value={monitoring.summary.trendDirection ?? 'STABLE'}
                    valueStyle={{
                      color: monitoring.summary.trendDirection === 'INCREASING' ? '#ff4d4f' :
                             monitoring.summary.trendDirection === 'DECREASING' ? '#52c41a' : '#1890ff'
                    }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Mitigation Progress"
                    value={`${monitoring.mitigationProgress?.completed ?? 0}/${monitoring.mitigationProgress?.total ?? 0}`}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="Effectiveness Rate"
                    value={monitoring.mitigationProgress?.effectivenessRate ?? 0}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Tabs */}
          <Card>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              tabBarStyle={{
                cursor: 'pointer',
                userSelect: 'none'
              }}
              tabBarExtraContent={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              }
            >
              <TabPane
                tab={
                  <span>
                    <SafetyOutlined />
                    Risks
                  </span>
                }
                key="risks"
              >
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddRisk}
                  >
                    Add Risk
                  </Button>
                </div>
                <Table
                  columns={riskColumns}
                  dataSource={safeRisks}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1400 }}
                />
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <CheckCircleOutlined />
                    Mitigations
                  </span>
                }
                key="mitigations"
              >
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddMitigation()}
                  >
                    Add Mitigation
                  </Button>
                </div>
                <Table
                  columns={mitigationColumns}
                  dataSource={safeMitigations}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1000 }}
                />
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <DashboardOutlined />
                    Risk Matrix
                  </span>
                }
                key="matrix"
              >
                {riskMatrix && <RiskMatrix data={riskMatrix} />}
                {!riskMatrix && <Alert message="No risk matrix data available" type="info" />}
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <FileTextOutlined />
                    Overview
                  </span>
                }
                key="overview"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="Risk Distribution by Severity">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {riskMatrix && riskMatrix.summary && Object.entries(riskMatrix.summary.bySeverity || {}).map(([severity, count]) => (
                          <div key={severity}>
                            <Text>{severity}: {count}</Text>
                            <Progress
                              percent={riskMatrix.summary.totalRisks > 0 ? (count / riskMatrix.summary.totalRisks) * 100 : 0}
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
                            <Tag color={getSeverityColor(risk.severity)} style={{ marginLeft: 8 }}>
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
              </TabPane>
            </Tabs>
          </Card>
        </Spin>
      )}

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
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  {safeCategories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
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
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="probability"
                label="Probability"
                rules={[{ required: true, message: 'Please select probability' }]}
              >
                <Select placeholder="Select probability">
                  <Option value={RiskProbability.VERY_LOW}>Very Low (1)</Option>
                  <Option value={RiskProbability.LOW}>Low (2)</Option>
                  <Option value={RiskProbability.MEDIUM}>Medium (3)</Option>
                  <Option value={RiskProbability.HIGH}>High (4)</Option>
                  <Option value={RiskProbability.VERY_HIGH}>Very High (5)</Option>
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
                  <Option value={RiskImpact.VERY_LOW}>Very Low (1)</Option>
                  <Option value={RiskImpact.LOW}>Low (2)</Option>
                  <Option value={RiskImpact.MEDIUM}>Medium (3)</Option>
                  <Option value={RiskImpact.HIGH}>High (4)</Option>
                  <Option value={RiskImpact.VERY_HIGH}>Very High (5)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="mitigationPlan" label="Mitigation Plan">
            <TextArea rows={2} placeholder="Describe mitigation strategy" />
          </Form.Item>

          <Form.Item name="contingencyPlan" label="Contingency Plan">
            <TextArea rows={2} placeholder="Describe contingency plan" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="identifiedDate"
                label="Identified Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reviewDate" label="Review Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="ownerId" label="Owner (User ID)">
            <Input placeholder="Enter owner user ID" />
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
              <Option value={RiskProbability.VERY_LOW}>Very Low (1)</Option>
              <Option value={RiskProbability.LOW}>Low (2)</Option>
              <Option value={RiskProbability.MEDIUM}>Medium (3)</Option>
              <Option value={RiskProbability.HIGH}>High (4)</Option>
              <Option value={RiskProbability.VERY_HIGH}>Very High (5)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="residualImpact"
            label="Residual Impact"
            rules={[{ required: true, message: 'Please select residual impact' }]}
          >
            <Select placeholder="Select residual impact">
              <Option value={RiskImpact.VERY_LOW}>Very Low (1)</Option>
              <Option value={RiskImpact.LOW}>Low (2)</Option>
              <Option value={RiskImpact.MEDIUM}>Medium (3)</Option>
              <Option value={RiskImpact.HIGH}>High (4)</Option>
              <Option value={RiskImpact.VERY_HIGH}>Very High (5)</Option>
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
              <Form.Item name="estimatedCost" label="Estimated Cost ($)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="effectiveness" label="Effectiveness (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="assignedToId" label="Assigned To (User ID)">
            <Input placeholder="Enter user ID" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectRisk;
