import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Typography, Row, Col, Button, Space, Table, Tag, Alert, Modal,
  Form, Input, Select, DatePicker, InputNumber, message, Spin,
  Popconfirm, Drawer, Descriptions, Divider, Tooltip, Empty, Upload, Grid,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  DollarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PaperClipOutlined, FilterOutlined, CloseOutlined, UploadOutlined,
  FilePdfOutlined, FileImageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import ProjectSelector from '../../../components/common/ProjectSelector';
import { useProject } from '../../../contexts/ProjectContext';
import {
  costService,
  Cost, Budget, Expense,
  CostType, BudgetStatus, ExpenseCategory, ExpenseStatus, ExpenseAttachment,
  CreateCostData, CreateBudgetData, CreateExpenseData, ExpenseFilters,
} from '../../../services/costService';
import { useAuth } from '../../../contexts/AuthContext';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// ── Theme constants ──────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: '#1f1f1f',
  border: '1px solid rgba(0,153,68,0.2)',
  borderRadius: 12,
};
const inputStyle: React.CSSProperties = {
  background: '#2a2a2a',
  borderColor: 'rgba(255,255,255,0.15)',
  color: '#fff',
};

// ── Budget status colors ─────────────────────────────────────────────────────
const budgetStatusColors: Record<BudgetStatus, string> = {
  [BudgetStatus.PLANNED]:  'blue',
  [BudgetStatus.APPROVED]: 'green',
  [BudgetStatus.CLOSED]:   'default',
  [BudgetStatus.REVISED]:  'orange',
};

// ── Expense status + category colors ────────────────────────────────────────
const STATUS_COLOR: Record<ExpenseStatus, string> = {
  [ExpenseStatus.PENDING]:  '#faad14',
  [ExpenseStatus.APPROVED]: '#52c41a',
  [ExpenseStatus.REJECTED]: '#ff4d4f',
  [ExpenseStatus.PAID]:     '#00b96b',
};

const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MATERIAL]:      '#fa8c16',
  [ExpenseCategory.LABOR]:         '#1890ff',
  [ExpenseCategory.EQUIPMENT]:     '#722ed1',
  [ExpenseCategory.OVERHEAD]:      '#8c8c8c',
  [ExpenseCategory.SUBCONTRACTOR]: '#13c2c2',
  [ExpenseCategory.PERMITS]:       '#eb2f96',
  [ExpenseCategory.OTHER]:         '#595959',
};

// ── Formatters ───────────────────────────────────────────────────────────────
const fmtCurrency = (amount: number, currency = 'PHP') =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);

const fmtDate = (d: string) => dayjs(d).format('MMM DD, YYYY');

// ────────────────────────────────────────────────────────────────────────────
// SUBMITTER CHIP
// ────────────────────────────────────────────────────────────────────────────
const SubmitterChip: React.FC<{ submitter?: Expense['submitter'] }> = ({ submitter }) => {
  if (!submitter) return <Text style={{ color: '#595959' }}>—</Text>;
  const initials = `${submitter.firstName[0]}${submitter.lastName[0]}`.toUpperCase();
  return (
    <Tooltip title={`${submitter.firstName} ${submitter.lastName} · ${submitter.email}`}>
      <Space size={6}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(0,153,68,0.25)', border: '1px solid #009944',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#00ff88', flexShrink: 0,
        }}>
          {initials}
        </div>
        <Text style={{ color: '#d9d9d9', fontSize: 12 }}>
          {submitter.firstName} {submitter.lastName}
        </Text>
      </Space>
    </Tooltip>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// RECEIPT CHIP
// ────────────────────────────────────────────────────────────────────────────
const ReceiptChip: React.FC<{
  attachments?: ExpenseAttachment[] | null;
  onView?: () => void;
}> = ({ attachments, onView }) => {
  const count = attachments?.length ?? 0;
  if (count === 0) return <Text style={{ color: '#595959' }}>—</Text>;
  return (
    <Button
      type="link"
      size="small"
      icon={<PaperClipOutlined />}
      onClick={e => { e.stopPropagation(); onView?.(); }}
      style={{ padding: 0, color: '#009944', fontSize: 12 }}
    >
      {count === 1 ? 'View' : `${count} files`}
    </Button>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// REJECT REASON MODAL
// ────────────────────────────────────────────────────────────────────────────
const RejectModal: React.FC<{
  visible: boolean;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({ visible, loading, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open={visible}
      title={<Text style={{ color: '#fff' }}>Reject Expense — Reason Required</Text>}
      onCancel={onCancel}
      onOk={() => { if (reason.trim()) onConfirm(reason.trim()); }}
      okText="Reject"
      okButtonProps={{ danger: true, loading, disabled: !reason.trim() }}
      cancelButtonProps={{ disabled: loading }}
      styles={{ content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' }, header: { background: '#1f1f1f' } }}
    >
      <TextArea
        rows={3}
        placeholder="Enter rejection reason…"
        value={reason}
        onChange={e => setReason(e.target.value)}
        style={{ ...inputStyle, marginTop: 12, resize: 'none' }}
      />
    </Modal>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// EXPENSE DETAIL DRAWER
// ────────────────────────────────────────────────────────────────────────────
interface DetailDrawerProps {
  expense: Expense | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (exp: Expense) => void;
  onDeleted: (id: string) => void;
  onEdit: (exp: Expense) => void;
  currentUserRole: string;
  currentUserId: string;
}

const ExpenseDetailDrawer: React.FC<DetailDrawerProps> = ({
  expense, open, onClose, onUpdated, onDeleted, onEdit,
  currentUserRole, currentUserId,
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!expense) return null;

  const canManage = ['ADMIN', 'PROJECT_MANAGER', 'ARCHITECT', 'ENGINEER'].includes(currentUserRole || '');
  const isOwner = expense.submittedBy === currentUserId;
  const canUploadReceipt = (isOwner || canManage) &&
    expense.status === ExpenseStatus.PENDING &&
    (expense.attachments?.length ?? 0) < 5;
  const canDeleteReceipt = (isOwner || canManage) && expense.status === ExpenseStatus.PENDING;

  const handleAction = async (action: string, fn: () => Promise<Expense | void>) => {
    setActionLoading(action);
    try {
      const result = await fn();
      if (result) onUpdated(result);
      message.success(`Expense ${action} successfully`);
    } catch (err: any) {
      message.error(err.message || `Failed to ${action} expense`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Expense',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await costService.deleteExpense(expense.id);
          onDeleted(expense.id);
          onClose();
          message.success('Expense deleted');
        } catch (err: any) {
          message.error(err.message || 'Failed to delete expense');
        }
      },
    });
  };

  const handleReject = async (reason: string) => {
    setRejectModalOpen(false);
    await handleAction('rejected', () => costService.rejectExpense(expense.id, reason));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { message.error('File must be under 5 MB'); return; }
    setUploadLoading(true);
    try {
      const updated = await costService.uploadReceipt(expense.id, file);
      onUpdated(updated);
      message.success('Receipt uploaded');
    } catch (err: any) {
      message.error(err.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteReceipt = async (index: number) => {
    setActionLoading(`receipt-${index}`);
    try {
      const updated = await costService.deleteReceipt(expense.id, index);
      onUpdated(updated);
      message.success('Receipt deleted');
    } catch (err: any) {
      message.error(err.message || 'Failed to delete receipt');
    } finally {
      setActionLoading(null);
    }
  };

  const getFileIcon = (mimeType: string) =>
    mimeType.startsWith('image/') ? <FileImageOutlined style={{ color: '#009944' }} /> : <FilePdfOutlined style={{ color: '#ff4d4f' }} />;

  return (
    <>
      <Drawer
        title={
          <Space>
            <DollarOutlined style={{ color: '#009944' }} />
            <Text strong style={{ color: '#fff', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {expense.name}
            </Text>
          </Space>
        }
        placement="right"
        width={580}
        open={open}
        onClose={onClose}
        styles={{
          body: { background: '#141414', padding: 24 },
          header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)' },
        }}
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card style={cardStyle} styles={{ body: { padding: '12px 16px' } }}>
              <Text style={{ color: '#8c8c8c', fontSize: 11 }}>AMOUNT</Text>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                {fmtCurrency(expense.amount, expense.currency)}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card style={cardStyle} styles={{ body: { padding: '12px 16px' } }}>
              <Text style={{ color: '#8c8c8c', fontSize: 11 }}>STATUS</Text>
              <div style={{ marginTop: 6 }}>
                <Tag color={STATUS_COLOR[expense.status]} style={{ fontSize: 13, fontWeight: 700, padding: '2px 10px' }}>
                  {expense.status}
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          title={<Text style={{ color: '#00ff88', fontSize: 13 }}>Details</Text>}
          style={cardStyle}
          styles={{
            body: { padding: 16 },
            header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)', minHeight: 40, padding: '8px 16px' },
          }}
        >
          <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c', width: 130 }} contentStyle={{ color: '#fff' }}>
            <Descriptions.Item label="Category">
              <Tag color={CATEGORY_COLOR[expense.category]}>{expense.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date">{fmtDate(expense.date)}</Descriptions.Item>
            <Descriptions.Item label="Project">{expense.project?.name || expense.projectId}</Descriptions.Item>
            {expense.budget && (
              <Descriptions.Item label="Budget">{expense.budget.name}</Descriptions.Item>
            )}
            {expense.vendor && <Descriptions.Item label="Vendor">{expense.vendor}</Descriptions.Item>}
            {expense.invoiceNumber && <Descriptions.Item label="Invoice #">{expense.invoiceNumber}</Descriptions.Item>}
            {expense.receiptNumber && <Descriptions.Item label="Receipt #">{expense.receiptNumber}</Descriptions.Item>}
            {expense.description && <Descriptions.Item label="Description">{expense.description}</Descriptions.Item>}
            {expense.notes && <Descriptions.Item label="Notes">{expense.notes}</Descriptions.Item>}
            <Descriptions.Item label="Submitted By">
              {expense.submitter
                ? `${expense.submitter.firstName} ${expense.submitter.lastName}`
                : <Text style={{ color: '#595959' }}>—</Text>}
            </Descriptions.Item>
            {expense.approver && (
              <Descriptions.Item label="Approved By">
                {expense.approver.firstName} {expense.approver.lastName}
                {expense.approvedAt && (
                  <Text style={{ color: '#8c8c8c', fontSize: 11 }}> · {fmtDate(expense.approvedAt)}</Text>
                )}
              </Descriptions.Item>
            )}
            {expense.rejectionReason && (
              <Descriptions.Item label="Rejection Reason">
                <Text style={{ color: '#ff4d4f' }}>{expense.rejectionReason}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created">{dayjs(expense.createdAt).fromNow()}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Divider style={{ borderColor: 'rgba(0,153,68,0.2)', margin: '16px 0' }} />
        <Card
          title={
            <Space>
              <PaperClipOutlined style={{ color: '#009944' }} />
              <Text style={{ color: '#00ff88', fontSize: 13 }}>
                Receipts ({expense.attachments?.length ?? 0}/5)
              </Text>
            </Space>
          }
          style={cardStyle}
          styles={{
            body: { padding: 16 },
            header: { background: '#1f1f1f', borderBottom: '1px solid rgba(0,153,68,0.2)', minHeight: 40, padding: '8px 16px' },
          }}
          extra={
            canUploadReceipt && (
              <>
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  loading={uploadLoading}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ color: '#009944', borderColor: '#009944', fontSize: 12 }}
                >
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </>
            )
          }
        >
          {!expense.attachments || expense.attachments.length === 0 ? (
            <Text style={{ color: '#595959', fontSize: 12 }}>No receipts attached.</Text>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {expense.attachments.map((att, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    maxWidth: 220,
                  }}
                >
                  {getFileIcon(att.mimeType)}
                  <a
                    href={costService.getReceiptUrl(att)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#d9d9d9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={att.originalName}
                  >
                    {att.originalName}
                  </a>
                  {canDeleteReceipt && (
                    <Popconfirm
                      title="Remove this receipt?"
                      onConfirm={() => handleDeleteReceipt(idx)}
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        loading={actionLoading === `receipt-${idx}`}
                        style={{ color: '#ff4d4f', padding: 0, minWidth: 20, height: 20 }}
                      />
                    </Popconfirm>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Divider style={{ borderColor: 'rgba(0,153,68,0.2)', margin: '16px 0' }} />
        <Space wrap>
          {canManage && expense.status === ExpenseStatus.PENDING && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={actionLoading === 'approved'}
              onClick={() => handleAction('approved', () => costService.approveExpense(expense.id))}
              style={{ background: '#009944', borderColor: '#009944' }}
            >
              Approve
            </Button>
          )}
          {canManage && expense.status === ExpenseStatus.PENDING && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              loading={actionLoading === 'rejected'}
              onClick={() => setRejectModalOpen(true)}
            >
              Reject
            </Button>
          )}
          {canManage && expense.status === ExpenseStatus.APPROVED && (
            <Button
              icon={<DollarOutlined />}
              loading={actionLoading === 'paid'}
              onClick={() => handleAction('paid', () => costService.payExpense(expense.id))}
              style={{ color: '#00b96b', borderColor: '#00b96b' }}
            >
              Mark Paid
            </Button>
          )}
          {(expense.status === ExpenseStatus.PENDING || canManage) && (
            <Button
              icon={<EditOutlined />}
              onClick={() => { onClose(); onEdit(expense); }}
              style={{ color: '#1890ff', borderColor: '#1890ff' }}
            >
              Edit
            </Button>
          )}
          {(expense.status !== ExpenseStatus.PAID || canManage) && (
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          )}
        </Space>
      </Drawer>

      <RejectModal
        visible={rejectModalOpen}
        loading={actionLoading === 'rejected'}
        onConfirm={handleReject}
        onCancel={() => setRejectModalOpen(false)}
      />
    </>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// ADD / EDIT EXPENSE MODAL (project-locked)
// ────────────────────────────────────────────────────────────────────────────
interface ExpenseModalProps {
  open: boolean;
  editing: Expense | null;
  lockedProjectId: string;
  budgets: Budget[];
  onClose: () => void;
  onSaved: (expense: Expense) => void;
}

const ExpenseFormModal: React.FC<ExpenseModalProps> = ({
  open, editing, lockedProjectId, budgets, onClose, onSaved,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const projectBudgets = budgets.filter(b => b.projectId === lockedProjectId);

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          name: editing.name,
          amount: editing.amount,
          category: editing.category,
          date: dayjs(editing.date),
          budgetId: editing.budgetId || undefined,
          vendor: editing.vendor || undefined,
          invoiceNumber: editing.invoiceNumber || undefined,
          description: editing.description || undefined,
        });
      } else {
        form.resetFields();
        form.setFieldValue('date', dayjs());
      }
      setPendingFile(null);
      setFileList([]);
    }
  }, [open, editing, form]);

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload: CreateExpenseData = {
        name: values.name,
        amount: values.amount,
        category: values.category,
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        projectId: lockedProjectId,
        budgetId: values.budgetId || undefined,
        vendor: values.vendor || undefined,
        invoiceNumber: values.invoiceNumber || undefined,
        description: values.description || undefined,
      };

      let saved: Expense;
      if (editing) {
        saved = await costService.updateExpense(editing.id, payload);
      } else {
        saved = await costService.createExpense(payload);
        if (pendingFile) {
          try {
            saved = await costService.uploadReceipt(saved.id, pendingFile);
          } catch {
            message.warning('Expense created but receipt upload failed');
          }
        }
      }
      onSaved(saved);
      message.success(`Expense ${editing ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err: any) {
      message.error(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { color: '#d9d9d9' };

  return (
    <Modal
      open={open}
      title={<Text strong style={{ color: '#fff' }}>{editing ? 'Edit Expense' : 'New Expense'}</Text>}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editing ? 'Save Changes' : 'Create Expense'}
      okButtonProps={{ loading: saving, style: { background: '#009944', borderColor: '#009944' } }}
      cancelButtonProps={{ disabled: saving }}
      width={640}
      styles={{ content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' }, header: { background: '#1f1f1f' } }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="name" label={<Text style={labelStyle}>Name</Text>} rules={[{ required: true }]}>
              <Input style={inputStyle} placeholder="e.g. Concrete Supply — Foundation" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="amount" label={<Text style={labelStyle}>Amount (PHP)</Text>} rules={[{ required: true }]}>
              <InputNumber style={{ ...inputStyle, width: '100%' }} min={0.01} precision={2} placeholder="0.00" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="category" label={<Text style={labelStyle}>Category</Text>} rules={[{ required: true }]}>
              <Select style={{ width: '100%' }} placeholder="Select category">
                {Object.values(ExpenseCategory).map(c => (
                  <Option key={c} value={c}>
                    <Tag color={CATEGORY_COLOR[c]} style={{ fontSize: 11 }}>{c}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="date" label={<Text style={labelStyle}>Date</Text>} rules={[{ required: true }]}>
              <DatePicker style={{ ...inputStyle, width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="budgetId" label={<Text style={labelStyle}>Budget (optional)</Text>}>
              <Select style={{ width: '100%' }} placeholder="None" allowClear>
                {projectBudgets.map(b => (
                  <Option key={b.id} value={b.id}>{b.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="vendor" label={<Text style={labelStyle}>Vendor (optional)</Text>}>
              <Input style={inputStyle} placeholder="Supplier name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="invoiceNumber" label={<Text style={labelStyle}>Invoice # (optional)</Text>}>
              <Input style={inputStyle} placeholder="INV-001" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label={<Text style={labelStyle}>Description (optional)</Text>}>
              <TextArea rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="Additional details…" />
            </Form.Item>
          </Col>
          {!editing && (
            <Col span={24}>
              <Form.Item label={<Text style={labelStyle}>Receipt (optional)</Text>}>
                <Upload
                  beforeUpload={file => {
                    if (file.size > 5 * 1024 * 1024) { message.error('File must be under 5 MB'); return false; }
                    setPendingFile(file);
                    setFileList([{ uid: file.name, name: file.name, status: 'done' }]);
                    return false;
                  }}
                  onRemove={() => { setPendingFile(null); setFileList([]); }}
                  fileList={fileList}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />} style={{ color: '#009944', borderColor: '#009944' }}>
                    Choose file
                  </Button>
                </Upload>
                <Text style={{ color: '#595959', fontSize: 11 }}>Max 5 MB · JPG, PNG, WEBP, PDF</Text>
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  );
};

const ProjectCost: React.FC = () => {
  const { user, can } = useAuth();
  const currentUserRole = (user as any)?.role ?? '';
  const currentUserId = (user as any)?.id ?? '';
  const { selectedProject, isLoading: projectsLoading } = useProject();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('costs');

  // ── Cost / Budget data ─────────────────────────────────
  const [costs, setCosts] = useState<Cost[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalCosts, setTotalCosts] = useState(0);

  // ── Expense data (paginated) ───────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [expensePage, setExpensePage] = useState(1);
  const [expensePageSize] = useState(10);
  const [expenseLoading, setExpenseLoading] = useState(false);

  // ── Expense filters ────────────────────────────────────
  const [filterSearch, setFilterSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | undefined>();
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // ── Expense summary (counts by status) ────────────────
  const [expenseSummary, setExpenseSummary] = useState({
    pending: 0, approved: 0, paid: 0, rejected: 0,
  });

  // ── Bulk approve ───────────────────────────────────────
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Detail drawer ──────────────────────────────────────
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Expense form modal ─────────────────────────────────
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // ── Cost / Budget modal states ─────────────────────────
  const [costModalVisible, setCostModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [costForm] = Form.useForm();
  const [budgetForm] = Form.useForm();

  // ── Load cost + budget data ────────────────────────────
  const loadCostData = useCallback(async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const [costsRes, budgetsRes] = await Promise.allSettled([
        costService.getCosts(),
        costService.getBudgets(),
      ]);
      if (costsRes.status === 'fulfilled') {
        const projectCosts = costsRes.value.filter((c: Cost) => c.projectId === selectedProject.id);
        setCosts(projectCosts);
        setTotalCosts(projectCosts.reduce((s: number, c: Cost) => s + (c.amount || 0), 0));
      }
      if (budgetsRes.status === 'fulfilled') {
        const projectBudgets = budgetsRes.value.filter((b: Budget) => b.projectId === selectedProject.id);
        setBudgets(projectBudgets);
        setTotalBudget(projectBudgets.reduce((s: number, b: Budget) => s + (b.amount || 0), 0));
      }
    } catch {
      message.error('Failed to load cost data');
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  // ── Load paginated expenses ────────────────────────────
  const loadExpenses = useCallback(async (
    page = expensePage,
    filters?: ExpenseFilters,
  ) => {
    if (!selectedProject) return;
    setExpenseLoading(true);
    try {
      const f: ExpenseFilters = {
        projectId: selectedProject.id,
        page,
        limit: expensePageSize,
        search: filterSearch || undefined,
        category: filterCategory,
        status: filterStatus,
        startDate: filterDateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filterDateRange?.[1]?.format('YYYY-MM-DD'),
        ...filters,
      };
      const result = await costService.getExpensesPaginated(f);
      setExpenses(result.expenses ?? []);
      setExpenseTotal(result.pagination?.totalItems ?? 0);

      // Build summary from returned items
      const all = result.expenses ?? [];
      setExpenseSummary({
        pending:  all.filter((e: Expense) => e.status === ExpenseStatus.PENDING).reduce((s: number, e: Expense) => s + e.amount, 0),
        approved: all.filter((e: Expense) => e.status === ExpenseStatus.APPROVED).reduce((s: number, e: Expense) => s + e.amount, 0),
        paid:     all.filter((e: Expense) => e.status === ExpenseStatus.PAID).reduce((s: number, e: Expense) => s + e.amount, 0),
        rejected: all.filter((e: Expense) => e.status === ExpenseStatus.REJECTED).reduce((s: number, e: Expense) => s + e.amount, 0),
      });
    } catch {
      message.error('Failed to load expenses');
    } finally {
      setExpenseLoading(false);
    }
  }, [selectedProject, expensePage, expensePageSize, filterSearch, filterCategory, filterStatus, filterDateRange]);

  useEffect(() => {
    if (selectedProject) {
      loadCostData();
      loadExpenses(1);
      setExpensePage(1);
    }
  }, [selectedProject]); // eslint-disable-line react-hooks/exhaustive-deps



  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const variance = totalBudget - totalCosts - totalExpenses;

  // ── Cost CRUD ──────────────────────────────────────────
  const handleAddCost = () => { setEditingCost(null); costForm.resetFields(); setCostModalVisible(true); };
  const handleEditCost = (cost: Cost) => {
    setEditingCost(cost);
    costForm.setFieldsValue({
      name: cost.name, type: cost.type, amount: cost.amount,
      date: cost.date ? dayjs(cost.date) : undefined,
      currency: cost.currency, description: cost.description,
    });
    setCostModalVisible(true);
  };
  const handleCostSubmit = async () => {
    if (!selectedProject) return;
    try {
      const values = await costForm.validateFields();
      const payload: CreateCostData = {
        name: values.name, type: values.type, amount: values.amount,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        currency: values.currency || 'PHP', description: values.description,
        projectId: selectedProject.id,
      };
      if (editingCost) { await costService.updateCost(editingCost.id, payload); message.success('Cost updated'); }
      else { await costService.createCost(payload); message.success('Cost created'); }
      setCostModalVisible(false);
      loadCostData();
    } catch (err: any) { message.error(err.message || 'Failed to save cost'); }
  };
  const handleDeleteCost = async (id: string) => {
    try { await costService.deleteCost(id); message.success('Cost deleted'); loadCostData(); }
    catch (err: any) { message.error(err.message || 'Failed to delete cost'); }
  };

  // ── Budget CRUD ────────────────────────────────────────
  const handleAddBudget = () => { setEditingBudget(null); budgetForm.resetFields(); setBudgetModalVisible(true); };
  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    budgetForm.setFieldsValue({
      name: budget.name, amount: budget.amount, currency: budget.currency,
      description: budget.description,
      startDate: budget.startDate ? dayjs(budget.startDate) : undefined,
      endDate: budget.endDate ? dayjs(budget.endDate) : undefined,
      contingency: budget.contingency, managementReserve: budget.managementReserve,
    });
    setBudgetModalVisible(true);
  };
  const handleBudgetSubmit = async () => {
    if (!selectedProject) return;
    try {
      const values = await budgetForm.validateFields();
      const payload: CreateBudgetData = {
        name: values.name, amount: values.amount, projectId: selectedProject.id,
        currency: values.currency || 'PHP', description: values.description,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
        endDate: values.endDate ? values.endDate.toISOString() : undefined,
        contingency: values.contingency, managementReserve: values.managementReserve,
      };
      if (editingBudget) { await costService.updateBudget(editingBudget.id, payload); message.success('Budget updated'); }
      else { await costService.createBudget(payload); message.success('Budget created'); }
      setBudgetModalVisible(false);
      loadCostData();
    } catch (err: any) { message.error(err.message || 'Failed to save budget'); }
  };
  const handleDeleteBudget = async (id: string) => {
    try { await costService.deleteBudget(id); message.success('Budget deleted'); loadCostData(); }
    catch (err: any) { message.error(err.message || 'Failed to delete budget'); }
  };
  const handleApproveBudget = async (id: string) => {
    try { await costService.approveBudget(id); message.success('Budget approved'); loadCostData(); }
    catch (err: any) { message.error(err.message || 'Failed to approve budget'); }
  };
  const handleCloseBudget = async (id: string) => {
    try { await costService.closeBudget(id); message.success('Budget closed'); loadCostData(); }
    catch (err: any) { message.error(err.message || 'Failed to close budget'); }
  };

  // ── Expense helpers ────────────────────────────────────
  const openExpenseDetail = (expense: Expense) => { setDetailExpense(expense); setDrawerOpen(true); };
  const handleExpenseUpdated = (updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    if (detailExpense?.id === updated.id) setDetailExpense(updated);
  };
  const handleExpenseDeleted = (deletedId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== deletedId));
    setExpenseTotal(t => Math.max(0, t - 1));
  };
  const handleExpenseSaved = (saved: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      return idx >= 0 ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev];
    });
    if (!editingExpense) setExpenseTotal(t => t + 1);
  };

  const handleBulkApprove = async () => {
    if (!selectedExpenseIds.length) { message.warning('Select at least one PENDING expense'); return; }
    setBulkLoading(true);
    try {
      await costService.bulkApproveExpenses(selectedExpenseIds);
      message.success(`${selectedExpenseIds.length} expense(s) approved`);
      setSelectedExpenseIds([]);
      loadExpenses(expensePage);
    } catch (err: any) {
      message.error(err.message || 'Failed to bulk approve');
    } finally {
      setBulkLoading(false);
    }
  };

  const applyFilters = () => { setExpensePage(1); loadExpenses(1); };
  const clearFilters = () => {
    setFilterSearch(''); setFilterCategory(undefined);
    setFilterStatus(undefined); setFilterDateRange(null);
    loadExpenses(1, { projectId: selectedProject!.id, page: 1, limit: expensePageSize });
  };

  // ── Table column definitions ────────────────────────────

  const costColumns: ColumnsType<Cost> = [
    { title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: CostType) => <Tag color="blue">{t}</Tag>, width: 130 },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (a: number, r: Cost) => fmtCurrency(a, r.currency),
    },
    {
      title: 'Date', dataIndex: 'date', key: 'date', width: 120,
      render: (d: string) => d ? fmtDate(d) : '—',
    },
    {
      title: 'Actions', key: 'actions', width: 110, align: 'center',
      render: (_: any, record: Cost) => (
        <Space size={4}>
          {can('ENGINEER_AND_ABOVE') && (
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEditCost(record)} />
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Popconfirm title="Delete this cost?" onConfirm={() => handleDeleteCost(record.id)} okButtonProps={{ danger: true }}>
              <Button type="link" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const budgetColumns: ColumnsType<Budget> = [
    { title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (a: number, r: Budget) => fmtCurrency(a, r.currency),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: (s: BudgetStatus) => <Tag color={budgetStatusColors[s]}>{s}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 180, align: 'center',
      render: (_: any, record: Budget) => (
        <Space size={4}>
          {can('MANAGER_AND_ABOVE') && (
            <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEditBudget(record)} />
          )}
          {can('MANAGER_AND_ABOVE') && record.status === BudgetStatus.PLANNED && (
            <Popconfirm title="Approve this budget?" onConfirm={() => handleApproveBudget(record.id)} okButtonProps={{ style: { background: '#009944' } }}>
              <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a' }} />
            </Popconfirm>
          )}
          {can('MANAGER_AND_ABOVE') && record.status === BudgetStatus.APPROVED && (
            <Popconfirm title="Close this budget?" onConfirm={() => handleCloseBudget(record.id)} okButtonProps={{ danger: true }}>
              <Button type="link" size="small" style={{ color: '#8c8c8c' }}>Close</Button>
            </Popconfirm>
          )}
          {can('MANAGER_AND_ABOVE') && (
            <Popconfirm title="Delete this budget?" onConfirm={() => handleDeleteBudget(record.id)} okButtonProps={{ danger: true }}>
              <Button type="link" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    {
      title: '',
      key: 'select',
      width: 36,
      render: (_: any, record: Expense) =>
        record.status === ExpenseStatus.PENDING ? (
          <input
            type="checkbox"
            checked={selectedExpenseIds.includes(record.id)}
            style={{ accentColor: '#009944' }}
            onChange={e =>
              setSelectedExpenseIds(prev =>
                e.target.checked ? [...prev, record.id] : prev.filter(id => id !== record.id)
              )
            }
          />
        ) : null,
    },
    {
      title: 'Name', dataIndex: 'name', key: 'name', ellipsis: true,
      render: (name: string, record: Expense) => (
        <Button type="link" style={{ padding: 0, color: '#00ff88', fontWeight: 500 }} onClick={() => openExpenseDetail(record)}>
          {name}
        </Button>
      ),
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', width: 130,
      render: (a: number, r: Expense) => fmtCurrency(a, r.currency),
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 130,
      render: (c: ExpenseCategory) => <Tag color={CATEGORY_COLOR[c]} style={{ fontSize: 11 }}>{c}</Tag>,
    },
    {
      title: 'Date', dataIndex: 'date', key: 'date', width: 110,
      render: (d: string) => fmtDate(d),
    },
    {
      title: 'Submitted By', key: 'submitter', width: 160,
      render: (_: any, record: Expense) => <SubmitterChip submitter={record.submitter} />,
    },
    {
      title: 'Receipts', key: 'receipts', width: 80, align: 'center',
      render: (_: any, record: Expense) => (
        <ReceiptChip
          attachments={record.attachments}
          onView={() => openExpenseDetail(record)}
        />
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: (s: ExpenseStatus) => (
        <Tag color={STATUS_COLOR[s]} style={{ fontWeight: 600, fontSize: 11 }}>{s}</Tag>
      ),
    },
  ];

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = { color: '#d9d9d9' };

  const costTabItems = [
    { key: 'costs',    label: 'Costs'    },
    { key: 'budgets',  label: 'Budgets'  },
    { key: 'expenses', label: 'Expenses' },
  ];

  const costQuickStats = [
    { label: 'Total Budget',     value: fmtCurrency(totalBudget),   color: '#1890ff', iconBg: 'rgba(24,144,255,0.12)'   },
    { label: 'Costs Logged',     value: fmtCurrency(totalCosts),    color: '#ffaa00', iconBg: 'rgba(255,170,0,0.12)'    },
    { label: 'Expenses Logged',  value: fmtCurrency(totalExpenses), color: '#722ed1', iconBg: 'rgba(114,46,209,0.12)'   },
    { label: 'Variance',         value: fmtCurrency(variance),      color: variance >= 0 ? '#009944' : '#ff0040', iconBg: variance >= 0 ? 'rgba(0,153,68,0.12)' : 'rgba(255,0,64,0.12)' },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <Title level={2} style={{ color: '#fff', marginBottom: 4 }}>Cost Management</Title>
            <Text style={{ color: '#8c8c8c' }}>Manage project budgets, work costs, and expense tracking in one place</Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Cost Management</Title>
            <Button
              icon={<ReloadOutlined style={{ color: '#009944' }} />}
              onClick={() => { loadCostData(); loadExpenses(expensePage); }}
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
              description={<span style={{ color: '#94a3b8' }}>Select a project above to manage its costs, budgets, and expenses.</span>}
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
                  {costTabItems.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); if (tab.key === 'expenses') loadExpenses(1); }}
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
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content panel */}
              <div style={{ background: '#1a1a1a', border: '1px solid #333333', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>

                {/* ── Costs ── */}
                {activeTab === 'costs' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('ENGINEER_AND_ABOVE') && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleAddCost}
                          style={{ background: '#009944', borderColor: '#009944', color: '#ffffff' }}
                        >
                          Add Cost
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={costColumns}
                      dataSource={costs}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                      locale={{ emptyText: <Empty description={<Text style={{ color: '#595959' }}>No costs recorded yet</Text>} /> }}
                    />
                  </>
                )}

                {/* ── Budgets ── */}
                {activeTab === 'budgets' && (
                  <>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #333333' }}>
                      {can('MANAGER_AND_ABOVE') && (
                        <Button
                          icon={<PlusOutlined />}
                          onClick={handleAddBudget}
                          style={{ background: '#009944', borderColor: '#009944', color: '#ffffff' }}
                        >
                          Create Budget
                        </Button>
                      )}
                    </div>
                    <Table
                      columns={budgetColumns}
                      dataSource={budgets}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      size="small"
                      locale={{ emptyText: <Empty description={<Text style={{ color: '#595959' }}>No budgets created yet</Text>} /> }}
                    />
                  </>
                )}

                {/* ── Expenses ── */}
                {activeTab === 'expenses' && (
                  <div style={{ padding: 16 }}>
                    {/* Status Summary */}
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                      {[
                        { label: 'Pending', amount: expenseSummary.pending, color: '#faad14' },
                        { label: 'Approved', amount: expenseSummary.approved, color: '#52c41a' },
                        { label: 'Paid', amount: expenseSummary.paid, color: '#00b96b' },
                        { label: 'Rejected', amount: expenseSummary.rejected, color: '#ff4d4f' },
                      ].map(({ label, amount, color }) => (
                        <Col key={label}>
                          <div style={{
                            background: '#2a2a2a',
                            border: `1px solid ${color}44`,
                            borderRadius: 8,
                            padding: '6px 14px',
                            display: 'inline-block',
                          }}>
                            <Text style={{ color: '#8c8c8c', fontSize: 11 }}>{label}</Text>
                            <div style={{ color, fontWeight: 700, fontSize: 15 }}>{fmtCurrency(amount)}</div>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    {/* Filter Bar */}
                    <Card
                      style={{ ...cardStyle, marginBottom: 12 }}
                      styles={{ body: { padding: '12px 16px' } }}
                    >
                      <Row gutter={[8, 8]} align="middle">
                        <Col xs={24} sm={6}>
                          <Input
                            prefix={<FilterOutlined style={{ color: '#595959' }} />}
                            placeholder="Search expenses…"
                            value={filterSearch}
                            onChange={e => setFilterSearch(e.target.value)}
                            onPressEnter={applyFilters}
                            style={inputStyle}
                            allowClear
                          />
                        </Col>
                        <Col xs={12} sm={4}>
                          <Select
                            placeholder="Category"
                            style={{ width: '100%' }}
                            value={filterCategory}
                            onChange={v => setFilterCategory(v)}
                            allowClear
                          >
                            {Object.values(ExpenseCategory).map(c => (
                              <Option key={c} value={c}><Tag color={CATEGORY_COLOR[c]} style={{ fontSize: 11 }}>{c}</Tag></Option>
                            ))}
                          </Select>
                        </Col>
                        <Col xs={12} sm={4}>
                          <Select
                            placeholder="Status"
                            style={{ width: '100%' }}
                            value={filterStatus}
                            onChange={v => setFilterStatus(v)}
                            allowClear
                          >
                            {Object.values(ExpenseStatus).map(s => (
                              <Option key={s} value={s}><Tag color={STATUS_COLOR[s]}>{s}</Tag></Option>
                            ))}
                          </Select>
                        </Col>
                        <Col xs={24} sm={6}>
                          <RangePicker
                            style={{ ...inputStyle, width: '100%' }}
                            value={filterDateRange}
                            onChange={v => setFilterDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                          />
                        </Col>
                        <Col>
                          <Space>
                            <Button
                              type="primary"
                              onClick={applyFilters}
                              style={{ background: '#009944', borderColor: '#009944' }}
                            >
                              Filter
                            </Button>
                            <Button onClick={clearFilters} style={{ color: '#8c8c8c', borderColor: '#595959' }}>
                              Clear
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Card>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {can('ENGINEER_AND_ABOVE') && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          style={{ background: '#009944', borderColor: '#009944' }}
                          onClick={() => { setEditingExpense(null); setExpenseFormOpen(true); }}
                        >
                          Add Expense
                        </Button>
                      )}
                      {can('MANAGER_AND_ABOVE') && selectedExpenseIds.length > 0 && (
                        <Button
                          icon={<CheckCircleOutlined />}
                          loading={bulkLoading}
                          onClick={handleBulkApprove}
                          style={{ color: '#52c41a', borderColor: '#52c41a' }}
                        >
                          Bulk Approve ({selectedExpenseIds.length})
                        </Button>
                      )}
                      {selectedExpenseIds.length > 0 && (
                        <Button
                          icon={<CloseOutlined />}
                          onClick={() => setSelectedExpenseIds([])}
                          style={{ color: '#8c8c8c', borderColor: '#595959' }}
                        >
                          Clear Selection
                        </Button>
                      )}
                    </div>

                    {/* Expense Table */}
                    <Table
                      columns={expenseColumns}
                      dataSource={expenses}
                      rowKey="id"
                      loading={expenseLoading}
                      pagination={{
                        current: expensePage,
                        pageSize: expensePageSize,
                        total: expenseTotal,
                        showSizeChanger: false,
                        showTotal: (total) => <Text style={{ color: '#8c8c8c' }}>{total} total</Text>,
                        onChange: (page) => { setExpensePage(page); loadExpenses(page); },
                      }}
                      onRow={(record) => ({ onClick: () => openExpenseDetail(record), style: { cursor: 'pointer' } })}
                      size="small"
                      locale={{ emptyText: <Empty description={<Text style={{ color: '#595959' }}>No expenses found</Text>} /> }}
                    />
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
            {costQuickStats.map((stat, i) => (
              <div key={i} style={{ background: '#1a1a1a', border: '1px solid #333333', borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{stat.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
              </div>
            ))}
          </div>
      </div>

      {/* ── Cost Modal ── */}
      <Modal
        title={<Text strong style={{ color: '#fff' }}>{editingCost ? 'Edit Cost' : 'Add Cost'}</Text>}
        open={costModalVisible}
        onOk={handleCostSubmit}
        onCancel={() => setCostModalVisible(false)}
        okText={editingCost ? 'Update' : 'Create'}
        okButtonProps={{ style: { background: '#009944', borderColor: '#009944' } }}
        styles={{ content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' }, header: { background: '#1f1f1f' } }}
      >
        <Form form={costForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label={<Text style={labelStyle}>Name</Text>} rules={[{ required: true }]}>
            <Input style={inputStyle} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={<Text style={labelStyle}>Type</Text>} rules={[{ required: true }]} initialValue={CostType.OTHER}>
                <Select style={{ width: '100%' }}>
                  {Object.values(CostType).map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label={<Text style={labelStyle}>Amount</Text>} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="date" label={<Text style={labelStyle}>Date</Text>} rules={[{ required: true }]}>
                <DatePicker style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {/* currency defaults to PHP */}
          <Form.Item name="currency" initialValue="PHP" hidden><Input /></Form.Item>
          <Form.Item name="description" label={<Text style={labelStyle}>Description</Text>}>
            <TextArea rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Budget Modal ── */}
      <Modal
        title={<Text strong style={{ color: '#fff' }}>{editingBudget ? 'Edit Budget' : 'Create Budget'}</Text>}
        open={budgetModalVisible}
        onOk={handleBudgetSubmit}
        onCancel={() => setBudgetModalVisible(false)}
        okText={editingBudget ? 'Update' : 'Create'}
        okButtonProps={{ style: { background: '#009944', borderColor: '#009944' } }}
        width={600}
        styles={{ content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' }, header: { background: '#1f1f1f' } }}
      >
        <Form form={budgetForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label={<Text style={labelStyle}>Name</Text>} rules={[{ required: true }]}>
            <Input style={inputStyle} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="amount" label={<Text style={labelStyle}>Amount</Text>} rules={[{ required: true }]}>
                <InputNumber min={0} style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {/* currency defaults to PHP */}
          <Form.Item name="currency" initialValue="PHP" hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label={<Text style={labelStyle}>Start Date</Text>}>
                <DatePicker style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label={<Text style={labelStyle}>End Date</Text>}>
                <DatePicker style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contingency" label={<Text style={labelStyle}>Contingency</Text>}>
                <InputNumber min={0} style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="managementReserve" label={<Text style={labelStyle}>Management Reserve</Text>}>
                <InputNumber min={0} style={{ ...inputStyle, width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label={<Text style={labelStyle}>Description</Text>}>
            <TextArea rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Expense Form Modal ── */}
      <ExpenseFormModal
        open={expenseFormOpen}
        editing={editingExpense}
        lockedProjectId={selectedProject?.id ?? ''}
        budgets={budgets}
        onClose={() => setExpenseFormOpen(false)}
        onSaved={handleExpenseSaved}
      />

      {/* ── Expense Detail Drawer ── */}
      <ExpenseDetailDrawer
        expense={detailExpense}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={handleExpenseUpdated}
        onDeleted={handleExpenseDeleted}
        onEdit={(exp) => { setEditingExpense(exp); setExpenseFormOpen(true); }}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
      />
    </>
  );
};

export default ProjectCost;
