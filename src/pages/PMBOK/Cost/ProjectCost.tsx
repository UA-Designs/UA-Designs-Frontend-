import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Table,
  Statistic,
  Progress,
  Alert,
  Spin,
  Tabs,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { Project } from '../../../types';
import { costService, Cost, Budget, Expense, EVMMetrics, CostOverview } from '../../../services/costService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ProjectCost: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [costs, setCosts] = useState<Cost[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [evmMetrics, setEvmMetrics] = useState<EVMMetrics | null>(null);
  const [costOverview, setCostOverview] = useState<CostOverview | null>(null);

  // Modal states
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);

  // Forms
  const [costForm] = Form.useForm();
  const [budgetForm] = Form.useForm();
  const [expenseForm] = Form.useForm();

  const handleProjectChange = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      loadCostData(project.id);
    } else {
      // Reset all data
      setCosts([]);
      setBudgets([]);
      setExpenses([]);
      setEvmMetrics(null);
      setCostOverview(null);
    }
  };

  const loadCostData = async (projectId: string) => {
    setLoading(true);
    try {
      // Load all cost-related data in parallel
      const [costsData, budgetsData, expensesData, evmData, overviewData] = await Promise.allSettled([
        costService.getCosts(projectId),
        costService.getBudgets(projectId),
        costService.getExpenses(projectId),
        costService.getEVMMetrics(projectId),
        costService.getCostOverview(projectId),
      ]);

      if (costsData.status === 'fulfilled' && Array.isArray(costsData.value)) setCosts(costsData.value);
      if (budgetsData.status === 'fulfilled' && Array.isArray(budgetsData.value)) setBudgets(budgetsData.value);
      if (expensesData.status === 'fulfilled' && Array.isArray(expensesData.value)) setExpenses(expensesData.value);
      if (evmData.status === 'fulfilled') setEvmMetrics(evmData.value);
      if (overviewData.status === 'fulfilled') setCostOverview(overviewData.value);
    } catch (error: any) {
      console.error('Error loading cost data:', error);
      message.error('Failed to load cost data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedProject) {
      loadCostData(selectedProject.id);
    }
  };

  // Cost CRUD operations
  const handleCreateCost = async (values: any) => {
    try {
      await costService.createCost({
        ...values,
        projectId: selectedProject?.id,
      });
      message.success('Cost item created successfully');
      setCostModalVisible(false);
      costForm.resetFields();
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to create cost item');
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      await costService.deleteCost(id);
      message.success('Cost item deleted successfully');
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to delete cost item');
    }
  };

  // Budget CRUD operations
  const handleCreateBudget = async (values: any) => {
    try {
      await costService.createBudget({
        ...values,
        projectId: selectedProject?.id,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
      });
      message.success('Budget created successfully');
      setBudgetModalVisible(false);
      budgetForm.resetFields();
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to create budget');
    }
  };

  const handleApproveBudget = async (id: string) => {
    try {
      await costService.approveBudget(id);
      message.success('Budget approved successfully');
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to approve budget');
    }
  };

  // Expense CRUD operations
  const handleCreateExpense = async (values: any) => {
    try {
      await costService.createExpense({
        ...values,
        projectId: selectedProject?.id,
        date: values.date.toISOString(),
      });
      message.success('Expense created successfully');
      setExpenseModalVisible(false);
      expenseForm.resetFields();
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to create expense');
    }
  };

  const handleApproveExpense = async (id: string) => {
    try {
      await costService.approveExpense(id);
      message.success('Expense approved successfully');
      handleRefresh();
    } catch (error: any) {
      message.error(error.message || 'Failed to approve expense');
    }
  };

  const handleRejectExpense = async (id: string) => {
    Modal.confirm({
      title: 'Reject Expense',
      content: (
        <Input.TextArea 
          placeholder="Enter rejection reason" 
          id="rejection-reason"
          rows={3}
        />
      ),
      onOk: async () => {
        const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value || 'Rejected';
        try {
          await costService.rejectExpense(id, reason);
          message.success('Expense rejected');
          handleRefresh();
        } catch (error: any) {
          message.error(error.message || 'Failed to reject expense');
        }
      },
    });
  };

  // Calculate totals from costs data - ensure costs is an array
  const safeCosts = Array.isArray(costs) ? costs : [];
  const totalBudgeted = safeCosts.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalActual = safeCosts.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  const totalVariance = totalActual - totalBudgeted;

  // Cost table columns
  const costColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={
          type === 'labor' ? 'blue' :
          type === 'material' ? 'green' :
          type === 'equipment' ? 'orange' :
          type === 'subcontractor' ? 'purple' :
          'default'
        }>
          {(type || 'other').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Estimated',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Actual',
      dataIndex: 'actualCost',
      key: 'actualCost',
      render: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Variance',
      key: 'variance',
      render: (_: any, record: Cost) => {
        const variance = (record.actualCost || 0) - (record.estimatedCost || 0);
        return (
          <Text style={{ color: variance < 0 ? '#009944' : variance > 0 ? '#ff4d4f' : '#8c8c8c' }}>
            {variance < 0 ? <FallOutlined /> : variance > 0 ? <RiseOutlined /> : null}
            ${Math.abs(variance).toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'estimated' ? 'blue' :
          status === 'approved' ? 'green' :
          status === 'committed' ? 'orange' :
          status === 'spent' ? 'red' :
          'default'
        }>
          {(status || 'pending').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Cost) => (
        <Space>
          <Button type="link" size="small" danger onClick={() => handleDeleteCost(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Budget table columns
  const budgetColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Spent',
      dataIndex: 'spentAmount',
      key: 'spentAmount',
      render: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Utilization',
      key: 'utilization',
      render: (_: any, record: Budget) => {
        const utilization = record.totalAmount > 0 
          ? Math.round((record.spentAmount / record.totalAmount) * 100) 
          : 0;
        return (
          <Progress 
            percent={utilization} 
            size="small" 
            status={utilization > 100 ? 'exception' : utilization > 80 ? 'active' : 'normal'}
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'draft' ? 'default' :
          status === 'pending_approval' ? 'orange' :
          status === 'approved' ? 'blue' :
          status === 'active' ? 'green' :
          status === 'closed' ? 'purple' :
          'default'
        }>
          {(status || 'draft').replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Budget) => (
        <Space>
          {record.status === 'pending_approval' && (
            <Button 
              type="link" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleApproveBudget(record.id)}
            >
              Approve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Expense table columns
  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `$${(value || 0).toLocaleString()}`,
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'pending' ? 'orange' :
          status === 'approved' ? 'green' :
          status === 'rejected' ? 'red' :
          status === 'paid' ? 'blue' :
          'default'
        }>
          {(status || 'pending').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Expense) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                size="small" 
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproveExpense(record.id)}
              >
                Approve
              </Button>
              <Button 
                type="link" 
                size="small" 
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectExpense(record.id)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Project Cost Management</Title>
        <Text type="secondary">
          Plan, estimate, budget, and control project costs
        </Text>
      </div>

      <ProjectSelector onProjectChange={handleProjectChange} />

      {!selectedProject && (
        <Alert
          message="No Project Selected"
          description="Please select a project from the dropdown above to manage its costs, budget, and financial tracking."
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
                  title="Total Budget"
                  value={costOverview?.totalBudget || selectedProject.budget || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  formatter={value => `$${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Total Spent"
                  value={costOverview?.totalSpent || totalActual}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#009944' }}
                  formatter={value => `$${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Remaining"
                  value={costOverview?.totalRemaining || (selectedProject.budget - totalActual)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  formatter={value => `$${Number(value).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Cost Variance"
                  value={totalVariance}
                  prefix={totalVariance < 0 ? <FallOutlined /> : <RiseOutlined />}
                  valueStyle={{ color: totalVariance < 0 ? '#009944' : '#ff4d4f' }}
                  formatter={value => `$${Math.abs(Number(value)).toLocaleString()}`}
                />
              </Card>
            </Col>
          </Row>

          {/* EVM Metrics */}
          {evmMetrics && (
            <Card title="Earned Value Management (EVM)" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6} md={4}>
                  <Tooltip title="Cost Performance Index - Efficiency of cost utilization">
                    <Statistic
                      title="CPI"
                      value={evmMetrics.costPerformanceIndex}
                      precision={2}
                      valueStyle={{ 
                        color: evmMetrics.costPerformanceIndex >= 1 ? '#009944' : '#ff4d4f' 
                      }}
                    />
                  </Tooltip>
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Tooltip title="Schedule Performance Index - Efficiency of schedule">
                    <Statistic
                      title="SPI"
                      value={evmMetrics.schedulePerformanceIndex}
                      precision={2}
                      valueStyle={{ 
                        color: evmMetrics.schedulePerformanceIndex >= 1 ? '#009944' : '#ff4d4f' 
                      }}
                    />
                  </Tooltip>
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Statistic
                    title="Planned Value"
                    value={evmMetrics.plannedValue}
                    formatter={value => `$${Number(value).toLocaleString()}`}
                  />
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Statistic
                    title="Earned Value"
                    value={evmMetrics.earnedValue}
                    formatter={value => `$${Number(value).toLocaleString()}`}
                  />
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Statistic
                    title="EAC"
                    value={evmMetrics.estimateAtCompletion}
                    formatter={value => `$${Number(value).toLocaleString()}`}
                  />
                </Col>
                <Col xs={12} sm={6} md={4}>
                  <Statistic
                    title="VAC"
                    value={evmMetrics.varianceAtCompletion}
                    valueStyle={{ 
                      color: evmMetrics.varianceAtCompletion >= 0 ? '#009944' : '#ff4d4f' 
                    }}
                    formatter={value => `$${Number(value).toLocaleString()}`}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Tabs for different cost management areas */}
          <Card>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              tabBarExtraContent={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              }
            >
              <TabPane tab="Costs" key="costs">
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setCostModalVisible(true)}
                  >
                    Add Cost Item
                  </Button>
                </div>
                <Table
                  columns={costColumns}
                  dataSource={safeCosts}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  summary={() => safeCosts.length > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>Total</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong>${totalBudgeted.toLocaleString()}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>${totalActual.toLocaleString()}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong style={{ color: totalVariance < 0 ? '#009944' : '#ff4d4f' }}>
                          {totalVariance < 0 ? <FallOutlined /> : <RiseOutlined />}
                          ${Math.abs(totalVariance).toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} colSpan={2} />
                    </Table.Summary.Row>
                  )}
                />
              </TabPane>

              <TabPane tab="Budgets" key="budgets">
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setBudgetModalVisible(true)}
                  >
                    Create Budget
                  </Button>
                </div>
                <Table
                  columns={budgetColumns}
                  dataSource={budgets}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              <TabPane tab="Expenses" key="expenses">
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setExpenseModalVisible(true)}
                  >
                    Add Expense
                  </Button>
                </div>
                <Table
                  columns={expenseColumns}
                  dataSource={expenses}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </TabPane>

              <TabPane tab="Analysis" key="analysis">
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card title="Cost Forecasting">
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div>
                          <Text strong>Estimated at Completion (EAC)</Text>
                          <br />
                          <Text type="secondary">
                            ${evmMetrics?.estimateAtCompletion?.toLocaleString() || 'N/A'}
                          </Text>
                        </div>
                        <div>
                          <Text strong>Variance at Completion (VAC)</Text>
                          <br />
                          <Text 
                            type="secondary" 
                            style={{ 
                              color: evmMetrics?.varianceAtCompletion 
                                ? evmMetrics.varianceAtCompletion >= 0 ? '#009944' : '#ff4d4f'
                                : undefined
                            }}
                          >
                            {evmMetrics?.varianceAtCompletion !== undefined
                              ? `${evmMetrics.varianceAtCompletion >= 0 ? '' : '-'}$${Math.abs(evmMetrics.varianceAtCompletion).toLocaleString()}`
                              : 'N/A'}
                          </Text>
                        </div>
                        <div>
                          <Text strong>Budget Utilization</Text>
                          <br />
                          <Progress 
                            percent={costOverview?.budgetUtilization || 0} 
                            status={
                              (costOverview?.budgetUtilization || 0) > 100 ? 'exception' :
                              (costOverview?.budgetUtilization || 0) > 80 ? 'active' : 'normal'
                            }
                          />
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title="Cost Control Actions">
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div>
                          <Text strong>Recommended Actions</Text>
                          <ul>
                            {evmMetrics?.costPerformanceIndex && evmMetrics.costPerformanceIndex < 1 && (
                              <li>Review material costs and negotiate with suppliers</li>
                            )}
                            {evmMetrics?.schedulePerformanceIndex && evmMetrics.schedulePerformanceIndex < 1 && (
                              <li>Optimize labor allocation to reduce overtime</li>
                            )}
                            {costOverview?.budgetUtilization && costOverview.budgetUtilization > 80 && (
                              <li>Consider value engineering for non-critical items</li>
                            )}
                            {(!evmMetrics || (evmMetrics.costPerformanceIndex >= 1 && evmMetrics.schedulePerformanceIndex >= 1)) && (
                              <li>Project is on track - continue monitoring</li>
                            )}
                          </ul>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Spin>
      )}

      {/* Cost Creation Modal */}
      <Modal
        title="Add Cost Item"
        open={costModalVisible}
        onCancel={() => setCostModalVisible(false)}
        footer={null}
      >
        <Form form={costForm} layout="vertical" onFinish={handleCreateCost}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Enter cost item name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Enter description" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="labor">Labor</Option>
              <Option value="material">Material</Option>
              <Option value="equipment">Equipment</Option>
              <Option value="subcontractor">Subcontractor</Option>
              <Option value="overhead">Overhead</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimatedCost" label="Estimated Cost" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualCost" label="Actual Cost">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="Status" initialValue="estimated">
            <Select>
              <Option value="estimated">Estimated</Option>
              <Option value="approved">Approved</Option>
              <Option value="committed">Committed</Option>
              <Option value="spent">Spent</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button onClick={() => setCostModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Budget Creation Modal */}
      <Modal
        title="Create Budget"
        open={budgetModalVisible}
        onCancel={() => setBudgetModalVisible(false)}
        footer={null}
      >
        <Form form={budgetForm} layout="vertical" onFinish={handleCreateBudget}>
          <Form.Item name="name" label="Budget Name" rules={[{ required: true }]}>
            <Input placeholder="Enter budget name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Enter description" />
          </Form.Item>
          <Form.Item name="totalAmount" label="Total Amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
          <Form.Item name="contingency" label="Contingency (%)" initialValue={10}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="dateRange" label="Budget Period" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button onClick={() => setBudgetModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Expense Creation Modal */}
      <Modal
        title="Add Expense"
        open={expenseModalVisible}
        onCancel={() => setExpenseModalVisible(false)}
        footer={null}
      >
        <Form form={expenseForm} layout="vertical" onFinish={handleCreateExpense}>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input placeholder="Enter expense description" />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
          <Form.Item name="vendor" label="Vendor">
            <Input placeholder="Enter vendor name" />
          </Form.Item>
          <Form.Item name="invoiceNumber" label="Invoice Number">
            <Input placeholder="Enter invoice number" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="budgetId" label="Budget">
            <Select placeholder="Select budget (optional)" allowClear>
              {budgets.map(budget => (
                <Option key={budget.id} value={budget.id}>{budget.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
              <Button onClick={() => setExpenseModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectCost;
