import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Typography, Row, Col, Button, Space, Table, Tag, Modal,
  Form, Input, Select, DatePicker, InputNumber, message, Spin,
  Popconfirm, Drawer, Descriptions, Divider, Tooltip, Empty, Upload, Grid,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  DollarOutlined, CheckCircleOutlined, CloseCircleOutlined,
  PaperClipOutlined, FilterOutlined, CloseOutlined, UploadOutlined,
  FilePdfOutlined, FileImageOutlined, DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { useProject } from '../../../contexts/ProjectContext';
import {
  costService,
  Budget, Expense,
  CostType, ExpenseCategory, ExpenseStatus, ExpenseAttachment,
  CreateExpenseData, CreateCostData, ExpenseFilters,
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

/** Map expense category to BOQ cost type so every expense is tracked in the BOQ */
function expenseCategoryToCostType(category: ExpenseCategory): CostType {
  switch (category) {
    case ExpenseCategory.MATERIAL: return CostType.MATERIAL;
    case ExpenseCategory.LABOR: return CostType.LABOR;
    case ExpenseCategory.EQUIPMENT: return CostType.EQUIPMENT;
    case ExpenseCategory.OVERHEAD: return CostType.OVERHEAD;
    default: return CostType.OTHER;
  }
}

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

  const canManage = ['ADMIN', 'PROPRIETOR', 'PROJECT_MANAGER', 'ARCHITECT', 'ENGINEER'].includes(currentUserRole || '');
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
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Delete
          </Button>
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
  /** When set and lockedProjectId is empty, show Project * dropdown */
  projects?: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (expense: Expense) => void;
}

const ExpenseFormModal: React.FC<ExpenseModalProps> = ({
  open, editing, lockedProjectId, budgets, projects = [], onClose, onSaved,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const formProjectId = Form.useWatch('projectId', form);
  const effectiveProjectId = lockedProjectId || formProjectId || '';
  const projectBudgets = budgets.filter(b => b.projectId === effectiveProjectId);
  const showProjectField = !lockedProjectId && (projects?.length ?? 0) > 0;

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          ...(showProjectField && { projectId: editing.projectId }),
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
  }, [open, editing, form, showProjectField]);

  const handleSubmit = async (values: any) => {
    const projectId = lockedProjectId || values.projectId;
    if (!projectId) {
      message.error('Please select a project');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateExpenseData = {
        name: values.name,
        amount: values.amount,
        category: values.category,
        date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
        projectId,
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
        // Track every expense in the BOQ: create a cost line so it appears in the project BOQ
        try {
          const costPayload: CreateCostData = {
            name: payload.name,
            type: expenseCategoryToCostType(payload.category),
            amount: payload.amount,
            date: payload.date,
            projectId: payload.projectId,
            description: payload.description,
          };
          await costService.createCost(costPayload);
        } catch (costErr: any) {
          message.warning('Expense saved but BOQ line could not be created: ' + (costErr?.message || ''));
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
      title={
        <div>
          <Text strong style={{ color: '#fff', display: 'block' }}>{editing ? 'Edit Expense' : 'Log Expense'}</Text>
          {!editing && <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Record a new expense for a project.</Text>}
        </div>
      }
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={editing ? 'Save Changes' : 'Log Expense'}
      okButtonProps={{ loading: saving, style: { background: '#009944', borderColor: '#009944' } }}
      cancelButtonProps={{ disabled: saving }}
      width={640}
      styles={{ content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' }, header: { background: '#1f1f1f' } }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          {showProjectField && (
            <Col span={24}>
              <Form.Item name="projectId" label={<Text style={labelStyle}>Project *</Text>} rules={[{ required: true, message: 'Select a project' }]}>
                <Select style={{ width: '100%' }} placeholder="Select a project" optionFilterProp="label">
                  {projects.map(p => (
                    <Option key={p.id} value={p.id} label={p.name}>{p.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
          <Col span={24}>
            <Form.Item name="name" label={<Text style={labelStyle}>Name</Text>} rules={[{ required: true }]}>
              <Input style={inputStyle} placeholder="e.g. Concrete Supply — Foundation" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="amount" label={<Text style={labelStyle}>Amount (₱) *</Text>} rules={[{ required: true }]}>
              <InputNumber style={{ ...inputStyle, width: '100%' }} min={0.01} precision={2} placeholder="0" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="category" label={<Text style={labelStyle}>Category *</Text>} rules={[{ required: true }]}>
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
            <Form.Item name="date" label={<Text style={labelStyle}>Date *</Text>} rules={[{ required: true }]}>
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
            <Form.Item name="vendor" label={<Text style={labelStyle}>Vendor/Supplier</Text>}>
              <Input style={inputStyle} placeholder="e.g. Home Depot" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="invoiceNumber" label={<Text style={labelStyle}>Invoice # (optional)</Text>}>
              <Input style={inputStyle} placeholder="INV-001" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label={<Text style={labelStyle}>Notes</Text>}>
              <TextArea rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="Additional details about this expense…" />
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
                    Upload Receipt
                  </Button>
                </Upload>
                <Text style={{ color: '#595959', fontSize: 11 }}>JPG, PNG, WebP, or PDF. Max 5 MB.</Text>
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
  const { projects = [] } = useProject();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  // ── Budgets (for Log Expense modal optional budget dropdown only) ──
  const [budgets, setBudgets] = useState<Budget[]>([]);

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

  // ── Load budgets once (for Log Expense modal optional budget dropdown) ──
  useEffect(() => {
    costService.getBudgets().then((b: Budget[]) => setBudgets(Array.isArray(b) ? b : [])).catch(() => {});
  }, []);

  // ── Load paginated expenses ────────────────────────────
  const loadExpenses = useCallback(async (
    page = expensePage,
    filters?: ExpenseFilters,
  ) => {
    setExpenseLoading(true);
    try {
      const f: ExpenseFilters = {
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
        pending:  all.filter((e: Expense) => e.status === ExpenseStatus.PENDING).reduce((s: number, e: Expense) => s + (Number(e.amount) || 0), 0),
        approved: all.filter((e: Expense) => e.status === ExpenseStatus.APPROVED).reduce((s: number, e: Expense) => s + (Number(e.amount) || 0), 0),
        paid:     all.filter((e: Expense) => e.status === ExpenseStatus.PAID).reduce((s: number, e: Expense) => s + (Number(e.amount) || 0), 0),
        rejected: all.filter((e: Expense) => e.status === ExpenseStatus.REJECTED).reduce((s: number, e: Expense) => s + (Number(e.amount) || 0), 0),
      });
    } catch {
      message.error('Failed to load expenses');
    } finally {
      setExpenseLoading(false);
    }
  }, [expensePage, expensePageSize, filterSearch, filterCategory, filterStatus, filterDateRange]);

  useEffect(() => {
    loadExpenses(1);
    setExpensePage(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Expense helpers ────────────────────────────────────
  const openExpenseDetail = (expense: Expense) => { setDetailExpense(expense); setDrawerOpen(true); };
  const handleExpenseUpdated = (updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    if (detailExpense?.id === updated.id) setDetailExpense(updated);
  };
  const handleExpenseDeleted = (deletedId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== deletedId));
    setExpenseTotal(t => Math.max(0, t - 1));
    // Refresh from server so summary totals (pending/approved/paid/rejected) stay accurate
    loadExpenses(expensePage);
  };
  const handleExpenseSaved = (saved: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      return idx >= 0 ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev];
    });
    if (!editingExpense) setExpenseTotal(t => t + 1);
    // Reload to pick up any backend-calculated fields and keep summary cards correct
    loadExpenses(expensePage);
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
    loadExpenses(1, { page: 1, limit: expensePageSize });
  };

  const handleDeleteExpense = async (record: Expense) => {
    try {
      await costService.deleteExpense(record.id);
      handleExpenseDeleted(record.id);
      message.success('Expense deleted');
    } catch (err: any) {
      message.error(err.message || 'Failed to delete expense');
    }
  };

  const exportExpensesCSV = () => {
    if (!expenses.length) {
      message.info('No expenses to export yet.');
      return;
    }
    const headers = ['Date', 'Project', 'Category', 'Vendor', 'Amount', 'Added By', 'Receipt'];
    const rows = expenses.map((r: Expense) => [
      r.date ? dayjs(r.date).format('M/D/YYYY') : '',
      r.project?.name || r.projectId || '—',
      r.category || '—',
      r.vendor || '—',
      (r.amount ?? 0).toFixed(2),
      r.submitter ? `${r.submitter.firstName} ${r.submitter.lastName}` : '—',
      (r.attachments?.length ?? 0) > 0 ? 'Yes' : '—',
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('CSV exported');
  };

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
            onClick={e => e.stopPropagation()}
            onChange={e =>
              setSelectedExpenseIds(prev =>
                e.target.checked ? [...prev, record.id] : prev.filter(id => id !== record.id)
              )
            }
          />
        ) : null,
    },
    {
      title: 'Date', dataIndex: 'date', key: 'date', width: 100,
      render: (d: string) => d ? dayjs(d).format('M/D/YYYY') : '—',
    },
    {
      title: 'Project', key: 'project', width: 180, ellipsis: true,
      render: (_: any, r: Expense) => <Text style={{ color: '#d9d9d9' }}>{r.project?.name || r.projectId || '—'}</Text>,
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category', width: 110,
      render: (c: ExpenseCategory) => <Tag color={CATEGORY_COLOR[c]} style={{ fontSize: 11 }}>{c}</Tag>,
    },
    {
      title: 'Vendor', dataIndex: 'vendor', key: 'vendor', width: 120, ellipsis: true,
      render: (v: string) => <Text style={{ color: '#bbb' }}>{v || '—'}</Text>,
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right', width: 110,
      render: (a: number, r: Expense) => <Text style={{ color: '#00ff88' }}>{fmtCurrency(a, r.currency)}</Text>,
    },
    {
      title: 'Added By', key: 'submitter', width: 120,
      render: (_: any, record: Expense) => <SubmitterChip submitter={record.submitter} />,
    },
    {
      title: 'Receipt', key: 'receipts', width: 80, align: 'center',
      render: (_: any, record: Expense) => (
        <ReceiptChip
          attachments={record.attachments}
          onView={() => openExpenseDetail(record)}
        />
      ),
    },
    {
      title: '', key: 'delete', width: 48, align: 'center',
      render: (_: any, record: Expense) => (
        <Popconfirm
          title="Delete this expense?"
          onConfirm={() => handleDeleteExpense(record)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={e => e.stopPropagation()} />
        </Popconfirm>
      ),
    },
  ];

  // ────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = { color: '#d9d9d9' };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <Title level={2} style={{ color: '#fff', marginBottom: 4 }}>Expenses</Title>
            <Text style={{ color: '#8c8c8c' }}>Track and export project expenses</Text>
          </div>

          <Spin spinning={expenseLoading}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <Button
                        icon={<ReloadOutlined style={{ color: '#009944' }} />}
                        onClick={() => loadExpenses(expensePage)}
                        style={{ background: 'transparent', borderColor: '#333333', color: '#ffffff' }}
                      >
                        Refresh
                      </Button>
                      <Space>
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={exportExpensesCSV}
                          style={{ color: '#d9d9d9', borderColor: '#595959' }}
                        >
                          Export CSV
                        </Button>
                        {can('ENGINEER_AND_ABOVE') && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{ background: '#009944', borderColor: '#009944' }}
                            onClick={() => { setEditingExpense(null); setExpenseFormOpen(true); }}
                          >
                            Log Expense
                          </Button>
                        )}
                      </Space>
                    </div>
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

                    {/* Toolbar (bulk actions) */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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
          </Spin>
        </div>
      </div>

      {/* ── Expense Form Modal ── */}
      <ExpenseFormModal
        open={expenseFormOpen}
        editing={editingExpense}
        lockedProjectId=""
        budgets={budgets}
        projects={projects}
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
