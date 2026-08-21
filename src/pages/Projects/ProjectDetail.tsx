import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Badge,
  Tabs,
  Progress,
  Select,
  Spin,
  message,
  Space,
  Table,
  Empty,
  Input,
  Modal,
  Form,
  InputNumber,
  Segmented,
  DatePicker,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  BankOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  RightOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InboxOutlined,
  UserOutlined,
  ToolOutlined,
  CarryOutOutlined,
  UploadOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import {
  projectService,
  ProjectDashboardData,
} from '../../services/projectService';
import {
  costService,
  Budget,
  Expense,
  Cost,
  CostType,
  ExpenseCategory,
  CreateCostData,
} from '../../services/costService';
import {
  resourceService,
  Material,
  Labor,
  Equipment,
} from '../../services/resourceService';
import { riskService, Risk } from '../../services/riskService';
import { Project } from '../../types';
import { ChartErrorBoundary } from '../../components/Charts/ChartErrorBoundary';
import {
  BOQ_TRADE_CATEGORIES,
  getEffectiveTradeCategory,
} from '../../constants/boqTradeCategories';
import {
  getMaterialCategoryFromRecord,
  isKnownMaterialCategory,
} from '../../utils/materialCategory';
import { useAuth } from '../../contexts/AuthContext';
import ProjectAIChat from '../../components/ai/ProjectAIChat';

/** BOQ line unit of measure — stored as `unit` on the cost; backend accepts any string. */
const BOQ_UNIT_OF_MEASURE_OPTIONS = [
  { label: 'Lot', value: 'Lot' },
  { label: 'Lump Sum', value: 'Lump Sum' },
];

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusConfig: Record<string, { color: string; label: string }> = {
  planning: { color: 'blue', label: 'Planning' },
  active: { color: 'green', label: 'Active' },
  in_progress: { color: 'cyan', label: 'In Progress' },
  on_hold: { color: 'orange', label: 'On Hold' },
  completed: { color: 'purple', label: 'Completed' },
  cancelled: { color: 'red', label: 'Cancelled' },
};

const formatCurrency = (v?: number) =>
  v !== undefined && v !== null ? `₱${Number(v).toLocaleString('en-PH')}` : '—';

/** Show % used; use decimals or "<1%" when small so we don't show 0% for non-zero actual. */
const formatPctUsed = (actual: number, budget: number): string => {
  if (!budget) return actual ? '100' : '0';
  const pct = (actual / budget) * 100;
  if (pct === 0 && actual > 0) return '<1';
  if (pct > 0 && pct < 1) return pct.toFixed(1);
  return String(Math.round(pct));
};

const BOQ_LABEL_STYLE = { color: '#d9d9d9' };
const BOQ_INPUT_STYLE = {
  background: '#2a2a2a',
  borderColor: 'rgba(255,255,255,0.15)',
  color: '#fff',
};
const BOQ_MODAL_STYLES = {
  content: { background: '#1f1f1f', border: '1px solid rgba(0,153,68,0.2)' },
  header: { background: '#1f1f1f' },
};
const UNLINKED_MATERIAL_VALUE = '__unlinked_material__';

const normalizeBoqLineType = (type?: string): CostType | string => {
  const t = String(type || CostType.MATERIAL).toUpperCase();
  if (Object.values(CostType).includes(t as CostType)) return t as CostType;
  return CostType.MATERIAL;
};

const isBoqCostEditLocked = (cost: Cost): boolean => {
  const status = String(cost.status || '').toUpperCase();
  return status === 'APPROVED' || status === 'PAID';
};

interface BoqFormValues {
  tradeCategory?: string;
  category: CostType | string;
  materialId?: string;
  itemName?: string;
  estimatedQty?: number;
  unitCost?: number;
  unit?: string;
  scopeLines?: string;
  exclusionNotes?: string;
  notes?: string;
}

const buildBoqPayloadFromForm = (
  values: BoqFormValues,
  materials: Material[],
  projectId: string,
  options?: { fallbackMaterialName?: string; existingDate?: string }
): Partial<CreateCostData> => {
  const {
    category: cat,
    materialId,
    itemName,
    estimatedQty,
    unitCost,
    tradeCategory,
    notes,
    scopeLines,
    exclusionNotes,
    unit: unitOverride,
  } = values;
  const name =
    cat === CostType.MATERIAL
      ? (() => {
          if (materialId === UNLINKED_MATERIAL_VALUE) {
            return options?.fallbackMaterialName?.trim() || 'Unnamed item';
          }
          const item = materials.find(x => x.id === materialId);
          return (
            item?.name ??
            options?.fallbackMaterialName?.trim() ??
            'Unnamed item'
          );
        })()
      : (itemName || '').trim() || String(cat);

  const qty = Number(estimatedQty) || 0;
  const unitCostNum = Number(unitCost) || 0;
  const totalAmount = qty * unitCostNum;

  const mat =
    cat === CostType.MATERIAL ? materials.find(x => x.id === materialId) : null;
  const unitFromMaterial =
    mat && (mat as { unit?: string }).unit
      ? String((mat as { unit?: string }).unit).trim()
      : '';
  let unit = (unitOverride && String(unitOverride).trim()) || unitFromMaterial;
  if (!unit) {
    if (cat === CostType.MATERIAL) unit = 'pc';
    else if (cat === CostType.FUEL) unit = 'l';
    else unit = 'Lot';
  }

  const scopeOfWorks =
    typeof scopeLines === 'string'
      ? scopeLines
          .split(/\n/)
          .map(s => s.trim())
          .filter(Boolean)
      : [];
  const exclusionNotesArr =
    typeof exclusionNotes === 'string'
      ? exclusionNotes
          .split(/\n/)
          .map(s => s.trim())
          .filter(Boolean)
      : [];

  return {
    name,
    type: cat,
    amount: totalAmount || undefined,
    date: options?.existingDate || new Date().toISOString().split('T')[0],
    projectId,
    description: notes?.trim() || undefined,
    estimatedQty: qty,
    unitCost: unitCostNum,
    unit,
    tradeCategory: tradeCategory as string,
    scopeOfWorks: scopeOfWorks.length ? scopeOfWorks : undefined,
    exclusionNotes: exclusionNotesArr.length ? exclusionNotesArr : undefined,
  };
};

const costToBoqFormValues = (
  cost: Cost,
  materials: Material[]
): BoqFormValues => {
  const cat = normalizeBoqLineType(cost.type);
  const tradeCategory =
    cost.tradeCategory || getEffectiveTradeCategory(cost, BOQ_TRADE_CATEGORIES);
  let materialId: string | undefined;
  let itemName: string | undefined;

  if (cat === CostType.MATERIAL) {
    const matched = materials.find(
      m =>
        m.name.trim().toLowerCase() === (cost.name || '').trim().toLowerCase()
    );
    materialId = matched?.id ?? UNLINKED_MATERIAL_VALUE;
  } else {
    itemName = cost.name;
  }

  return {
    tradeCategory,
    category: cat,
    materialId,
    itemName,
    estimatedQty: cost.estimatedQty ?? 0,
    unitCost: cost.unitCost ?? cost.amount ?? 0,
    unit: cost.unit,
    scopeLines: (cost.scopeOfWorks || []).join('\n'),
    exclusionNotes: (cost.exclusionNotes || []).join('\n'),
    notes: cost.description,
  };
};

// ── Add / Edit BOQ Item Modal ──────────────────────────────────────────────
interface BOQItemModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  projectId: string;
  editingCost?: Cost | null;
  onClose: () => void;
  onSaved: (cost?: Cost) => void;
}

const BOQItemModal: React.FC<BOQItemModalProps> = ({
  open,
  mode,
  projectId,
  editingCost,
  onClose,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const category = Form.useWatch('category', form) || CostType.MATERIAL;
  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) return;
    if (category === CostType.MATERIAL) {
      form.setFieldValue('itemName', undefined);
    } else {
      form.setFieldValue('materialId', undefined);
    }
  }, [category, form, open]);

  useEffect(() => {
    if (!open || !projectId) return;
    setLoadingOptions(true);
    const load = async () => {
      const mList = await resourceService.getAllMaterials().catch(() => []);
      const list = Array.isArray(mList) ? mList : [];
      setMaterials(list);
      if (isEdit && editingCost) {
        form.setFieldsValue(costToBoqFormValues(editingCost, list));
      } else {
        form.resetFields();
        form.setFieldsValue({
          category: CostType.MATERIAL,
          estimatedQty: 0,
          unitCost: 0,
          tradeCategory: undefined,
        });
      }
    };
    load().finally(() => setLoadingOptions(false));
  }, [open, projectId, isEdit, editingCost?.id, form]);

  const materialSelectOptions = useMemo(() => {
    const opts = materials.map(m => ({ label: m.name, value: m.id }));
    if (
      isEdit &&
      editingCost &&
      normalizeBoqLineType(editingCost.type) === CostType.MATERIAL &&
      !materials.some(
        m =>
          m.name.trim().toLowerCase() ===
          (editingCost.name || '').trim().toLowerCase()
      )
    ) {
      opts.unshift({
        label: `${editingCost.name} (not in catalog)`,
        value: UNLINKED_MATERIAL_VALUE,
      });
    }
    return opts;
  }, [materials, isEdit, editingCost]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = buildBoqPayloadFromForm(values, materials, projectId, {
        fallbackMaterialName: editingCost?.name,
        existingDate:
          isEdit && editingCost?.date
            ? editingCost.date.split('T')[0]
            : undefined,
      });

      setSaving(true);
      if (isEdit && editingCost) {
        const updated = await costService.updateCost(editingCost.id, payload);
        message.success('BOQ item updated');
        onSaved(updated);
      } else {
        const created = await costService.createCost(payload as CreateCostData);
        message.success('BOQ item added');
        onSaved(created);
      }
      onClose();
      form.resetFields();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(
        err.message ||
          (isEdit ? 'Failed to update BOQ item' : 'Failed to add BOQ item')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit BOQ Item' : 'Add BOQ Item'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={isEdit ? 'Save changes' : 'Add to BOQ'}
      okButtonProps={{
        loading: saving,
        disabled: saving,
        style: { background: '#009944', borderColor: '#009944' },
      }}
      cancelButtonProps={{ disabled: saving }}
      width={560}
      destroyOnClose
      styles={BOQ_MODAL_STYLES}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="tradeCategory"
          label={<span style={BOQ_LABEL_STYLE}>Trade category *</span>}
          rules={[
            { required: true, message: 'Select the trade for this BOQ line' },
          ]}
        >
          <Select
            placeholder="e.g. Electrical Works, Plumbing Works"
            showSearch
            style={{ width: '100%' }}
            dropdownStyle={{ background: '#1f1f1f' }}
            optionFilterProp="label"
            options={BOQ_TRADE_CATEGORIES.map(t => ({ label: t, value: t }))}
          />
        </Form.Item>
        <Form.Item
          name="category"
          label={<span style={BOQ_LABEL_STYLE}>Line type *</span>}
          rules={[{ required: true }]}
        >
          <Segmented
            options={[
              { label: 'Material', value: CostType.MATERIAL },
              { label: 'Labor', value: CostType.LABOR },
              { label: 'Equipment', value: CostType.EQUIPMENT },
              { label: 'Fuel', value: CostType.FUEL },
              { label: 'Formworks', value: CostType.FORMWORKS },
            ]}
            block
            style={{ background: '#2a2a2a' }}
          />
        </Form.Item>
        {category === CostType.MATERIAL ? (
          <Form.Item
            name="materialId"
            label={<span style={BOQ_LABEL_STYLE}>Material *</span>}
            rules={[{ required: true, message: 'Select material' }]}
          >
            <Select
              placeholder="Select material"
              loading={loadingOptions}
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1f1f1f' }}
              optionFilterProp="label"
              options={materialSelectOptions}
              onChange={(materialId: string) => {
                if (materialId === UNLINKED_MATERIAL_VALUE) return;
                const mat = materials.find(x => x.id === materialId);
                if (!mat) return;
                const catalogCategory = getMaterialCategoryFromRecord(
                  mat as Record<string, unknown>
                );
                if (isKnownMaterialCategory(catalogCategory)) {
                  form.setFieldValue('tradeCategory', catalogCategory);
                }
              }}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="itemName"
            label={
              <span style={BOQ_LABEL_STYLE}>
                {category === CostType.LABOR
                  ? 'Labor'
                  : category === CostType.EQUIPMENT
                    ? 'Equipment'
                    : category === CostType.FUEL
                      ? 'Fuel'
                      : 'Formworks'}{' '}
                *
              </span>
            }
            rules={[{ required: true, message: 'Enter description' }]}
          >
            <Input
              placeholder={
                category === CostType.LABOR
                  ? 'e.g. Masonry labor, Electrical work'
                  : category === CostType.EQUIPMENT
                    ? 'e.g. Excavator, Concrete mixer'
                    : category === CostType.FUEL
                      ? 'e.g. Diesel, Gasoline'
                      : 'e.g. Column formwork, Slab formwork'
              }
              style={BOQ_INPUT_STYLE}
              allowClear
            />
          </Form.Item>
        )}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="estimatedQty"
              label={<span style={BOQ_LABEL_STYLE}>Estimated Qty *</span>}
              rules={[{ required: true }]}
              initialValue={0}
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%', ...BOQ_INPUT_STYLE }}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unitCost"
              label={<span style={BOQ_LABEL_STYLE}>Unit Cost *</span>}
              rules={[{ required: true }]}
              initialValue={0}
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%', ...BOQ_INPUT_STYLE }}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="unit"
          label={<span style={BOQ_LABEL_STYLE}>Unit of measure</span>}
        >
          <Select
            allowClear
            placeholder="Auto — material catalog, Lot (labor/equipment/formworks), or l (fuel)"
            style={{ width: '100%' }}
            dropdownStyle={{ background: '#1f1f1f' }}
            options={BOQ_UNIT_OF_MEASURE_OPTIONS}
          />
        </Form.Item>
        <Form.Item
          name="scopeLines"
          label={<span style={BOQ_LABEL_STYLE}>Scope of work (optional)</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="One bullet per line — appears under SCOPE OF WORKS for this trade on the BOQ report."
            style={{ ...BOQ_INPUT_STYLE, resize: 'none' }}
          />
        </Form.Item>
        <Form.Item
          name="exclusionNotes"
          label={
            <span style={BOQ_LABEL_STYLE}>Notes / exclusions (optional)</span>
          }
        >
          <Input.TextArea
            rows={2}
            placeholder="One note per line — shown in red on the BOQ report (e.g. exclusions)."
            style={{ ...BOQ_INPUT_STYLE, resize: 'none' }}
          />
        </Form.Item>
        <Form.Item
          name="notes"
          label={<span style={BOQ_LABEL_STYLE}>Internal notes</span>}
        >
          <Input.TextArea
            rows={2}
            placeholder="Optional — stored in description only."
            style={{ ...BOQ_INPUT_STYLE, resize: 'none' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] =
    useState<ProjectDashboardData | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expensesResult, setExpensesResult] = useState<{
    expenses: Expense[];
    pagination: { totalItems: number };
  }>({ expenses: [], pagination: { totalItems: 0 } });
  const [budgetOverview, setBudgetOverview] = useState<{
    budget: number;
    totalActualCost: number;
    variance: number;
    isOverBudget: boolean;
    expenseCount: number;
  } | null>(null);
  const [costOverview, setCostOverview] = useState<any>(null);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [varianceFilter, setVarianceFilter] = useState<
    'all' | 'material' | 'labor' | 'equipment'
  >('all');
  const [boqSearch, setBoqSearch] = useState('');
  const [varianceSearch, setVarianceSearch] = useState('');
  const [boqModalOpen, setBoqModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  const canEditBoqRow = useCallback(
    (record: Cost) => !isBoqCostEditLocked(record) || can('ADMIN_ONLY'),
    [can]
  );

  const openAddBoqModal = () => {
    setEditingCost(null);
    setBoqModalOpen(true);
  };

  const openEditBoqModal = (record: Cost) => {
    if (!canEditBoqRow(record)) {
      message.warning(
        'This BOQ item is approved or paid and can only be edited by an admin or proprietor.'
      );
      return;
    }
    setEditingCost(record);
    setBoqModalOpen(true);
  };

  const closeBoqModal = () => {
    setBoqModalOpen(false);
    setEditingCost(null);
  };
  const [logUsageModalOpen, setLogUsageModalOpen] = useState(false);
  const [logUsageForm] = Form.useForm();
  const [logExpenseModalOpen, setLogExpenseModalOpen] = useState(false);
  const [logExpenseForm] = Form.useForm();
  const [logExpenseSaving, setLogExpenseSaving] = useState(false);
  const [logExpenseReceiptFile, setLogExpenseReceiptFile] =
    useState<File | null>(null);
  const [logExpenseFileList, setLogExpenseFileList] = useState<UploadFile[]>(
    []
  );
  const [hasUnreviewedAiRisks, setHasUnreviewedAiRisks] = useState(false);

  useEffect(() => {
    if (logUsageModalOpen) {
      logUsageForm.resetFields();
      logUsageForm.setFieldsValue({ quantityUsed: 0, dateUsed: dayjs() });
    }
  }, [logUsageModalOpen, logUsageForm]);

  const projectIdNorm = (c: Cost) =>
    String(c.projectId ?? (c as any).project_id ?? '').toLowerCase();
  const refetchCosts = useCallback(async () => {
    if (!projectId) return;
    const pid = String(projectId).toLowerCase();
    try {
      const list = await costService.getCosts();
      const projectCosts = (list || []).filter(
        (c: Cost) => projectIdNorm(c) === pid
      );
      setCosts(prev => {
        if (projectCosts.length === 0 && prev.length > 0) return prev;
        return projectCosts;
      });
    } catch {
      message.warning(
        'Could not refresh BOQ list. Your new item may still appear below.'
      );
    }
  }, [projectId]);

  const refetchExpenses = useCallback(async () => {
    if (!projectId) return;
    try {
      const [expensesRes, budgetOv] = await Promise.all([
        costService
          .getExpensesPaginated({ projectId, limit: 100 })
          .catch(() => ({
            expenses: [],
            pagination: {
              totalItems: 0,
              currentPage: 1,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          })),
        projectService.getProjectBudgetOverview(projectId).catch(() => null),
      ]);
      setExpensesResult(expensesRes);
      if (budgetOv) setBudgetOverview(budgetOv);
    } catch {
      message.warning('Could not refresh expenses.');
    }
  }, [projectId]);

  const refreshAfterAiAction = useCallback(async () => {
    if (!projectId) return;
    try {
      const [proj, dash, budgetOv] = await Promise.all([
        projectService.getProjectById(projectId).catch(() => null),
        projectService.getProjectDashboard(projectId).catch(() => null),
        projectService.getProjectBudgetOverview(projectId).catch(() => null),
      ]);
      if (proj) setProject(proj);
      if (dash) setDashboardData(dash);
      if (budgetOv) setBudgetOverview(budgetOv);
      await Promise.all([refetchCosts(), refetchExpenses()]);
    } catch {
      /* keep the current project view */
    }
  }, [projectId, refetchCosts, refetchExpenses]);

  useEffect(() => {
    if (logExpenseModalOpen) {
      logExpenseForm.resetFields();
      logExpenseForm.setFieldsValue({
        projectId,
        date: dayjs(),
      });
      setLogExpenseReceiptFile(null);
      setLogExpenseFileList([]);
    }
  }, [logExpenseModalOpen, projectId, logExpenseForm]);

  const handleLogExpenseSubmit = useCallback(
    async (values: any) => {
      if (!projectId) return;
      setLogExpenseSaving(true);
      try {
        const payload = {
          name:
            values.name ||
            `${values.category ?? 'Expense'} — ₱${Number(values.amount || 0).toLocaleString()}`,
          amount: Number(values.amount) || 0,
          category: values.category as ExpenseCategory,
          date: (values.date as dayjs.Dayjs).format('YYYY-MM-DD'),
          projectId,
          budgetId: values.budgetId || undefined,
          costId: values.costId || undefined,
          vendor: values.vendor || undefined,
          invoiceNumber: values.invoiceNumber || undefined,
          description: values.notes || undefined,
        };
        const saved = await costService.createExpense(payload);
        if (logExpenseReceiptFile) {
          try {
            await costService.uploadReceipt(saved.id, logExpenseReceiptFile);
          } catch {
            message.warning('Expense saved but receipt upload failed.');
          }
        }
        await refetchExpenses();
        message.success('Expense logged successfully.');
        setLogExpenseModalOpen(false);
        logExpenseForm.resetFields();
      } catch (err: any) {
        message.error(err?.message || 'Failed to log expense.');
      } finally {
        setLogExpenseSaving(false);
      }
    },
    [projectId, logExpenseReceiptFile, logExpenseForm, refetchExpenses]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!projectId) {
        setProject(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [
          proj,
          budgetOv,
          dash,
          budgetsRes,
          expensesRes,
          overviewRes,
          costsRes,
          breakdownRes,
        ] = await Promise.all([
          projectService.getProjectById(projectId),
          projectService.getProjectBudgetOverview(projectId),
          projectService.getProjectDashboard(projectId).catch(() => null),
          costService.getBudgets(projectId).catch(() => []),
          costService
            .getExpensesPaginated({ projectId, limit: 100 })
            .catch(() => ({
              expenses: [],
              pagination: {
                totalItems: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
              },
            })),
          costService.getCostOverview(projectId).catch(() => null),
          costService.getCosts().catch(() => []),
          costService.getCostBreakdown(projectId).catch(() => null),
        ]);
        if (!cancelled) {
          setProject(proj);
          setBudgetOverview(budgetOv);
          setDashboardData(dash);
          setBudgets(Array.isArray(budgetsRes) ? budgetsRes : []);
          setExpensesResult(expensesRes);
          setCostOverview(overviewRes);
          const allCosts = Array.isArray(costsRes) ? costsRes : [];
          const pid = String(projectId).toLowerCase();
          setCosts(
            allCosts.filter(
              (c: Cost) =>
                String(
                  c.projectId ?? (c as any).project_id ?? ''
                ).toLowerCase() === pid
            )
          );
          setCostBreakdown(breakdownRes);
        }
      } catch (err: any) {
        if (!cancelled) message.error(err.message || 'Failed to load project');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Lightweight “AI suggestions pending” badge:
  // - If any risk has ai* fields AND those values differ from current rule-based fields,
  //   we consider them unreviewed (no backend review flag required for this UI prototype).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!projectId) {
        setHasUnreviewedAiRisks(false);
        return;
      }
      try {
        const res = await riskService.getRisks(projectId, undefined, 1, 200);
        const risks: Risk[] = Array.isArray(res?.risks) ? res.risks : [];
        const anyUnreviewed = risks.some(risk => {
          const r: any = risk as any;
          const hasAi =
            r.aiGeneratedAt != null ||
            r.aiConfidence != null ||
            r.aiSeverity != null ||
            r.aiProbability != null ||
            r.aiImpact != null ||
            r.aiRiskScore != null;

          if (!hasAi) return false;

          const mismatch =
            (typeof r.aiProbability === 'number' &&
              Number(r.aiProbability) !== Number(r.probability)) ||
            (typeof r.aiImpact === 'number' &&
              Number(r.aiImpact) !== Number(r.impact)) ||
            (typeof r.aiRiskScore === 'number' &&
              Number(r.aiRiskScore) !== Number(r.riskScore)) ||
            (typeof r.aiSeverity === 'string' && r.aiSeverity !== r.severity);

          return mismatch;
        });

        if (!cancelled) setHasUnreviewedAiRisks(anyUnreviewed);
      } catch {
        // Ignore badge failures; don’t block project detail load.
        if (!cancelled) setHasUnreviewedAiRisks(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Expense amounts by category (for actuals when no cost/BOQ items)
  const expensesByCategory = useMemo(() => {
    const list = expensesResult.expenses || [];
    const material = list
      .filter((e: Expense) => (e.category || '').toUpperCase() === 'MATERIAL')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const labor = list
      .filter((e: Expense) => (e.category || '').toUpperCase() === 'LABOR')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const equipment = list
      .filter((e: Expense) => (e.category || '').toUpperCase() === 'EQUIPMENT')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const other = list
      .filter(
        (e: Expense) =>
          !['MATERIAL', 'LABOR', 'EQUIPMENT'].includes(
            (e.category || '').toUpperCase()
          )
      )
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { material, labor, equipment, other };
  }, [expensesResult.expenses]);

  // All hooks must be called before any early return
  const boqByCategory = useMemo(() => {
    const breakdown = costBreakdown || {};
    // Some APIs return 0 for breakdown fields even when costs exist; only trust breakdown when > 0.
    const materialFromBreakdown = Number(
      (breakdown as any).materials ?? (breakdown as any).Material ?? 0
    );
    const laborFromBreakdown = Number(
      (breakdown as any).labor ?? (breakdown as any).Labor ?? 0
    );
    const equipmentFromBreakdown = Number(
      (breakdown as any).equipment ?? (breakdown as any).Equipment ?? 0
    );

    const typeIs = (c: Cost, t: string) =>
      (c.type || '').toString().toUpperCase() === t;
    const materialFromCosts = costs
      .filter(c => typeIs(c, 'MATERIAL'))
      .reduce((s, c) => s + (c.amount ?? 0), 0);
    const laborFromCosts = costs
      .filter(c => typeIs(c, 'LABOR'))
      .reduce((s, c) => s + (c.amount ?? 0), 0);
    const equipmentFromCosts = costs
      .filter(c => typeIs(c, 'EQUIPMENT'))
      .reduce((s, c) => s + (c.amount ?? 0), 0);

    const material =
      materialFromBreakdown > 0 ? materialFromBreakdown : materialFromCosts;
    const labor = laborFromBreakdown > 0 ? laborFromBreakdown : laborFromCosts;
    const equipment =
      equipmentFromBreakdown > 0 ? equipmentFromBreakdown : equipmentFromCosts;
    const materialCount = costs.filter(c => typeIs(c, 'MATERIAL')).length;
    const laborCount = costs.filter(c => typeIs(c, 'LABOR')).length;
    const equipmentCount = costs.filter(c => typeIs(c, 'EQUIPMENT')).length;
    return {
      material: typeof material === 'number' ? material : 0,
      labor: typeof labor === 'number' ? labor : 0,
      equipment: typeof equipment === 'number' ? equipment : 0,
      materialCount:
        breakdown.materialCount ?? breakdown.materialsCount ?? materialCount,
      laborCount: breakdown.laborCount ?? breakdown.laborCount ?? laborCount,
      equipmentCount: breakdown.equipmentCount ?? equipmentCount,
    };
  }, [costs, costBreakdown]);

  const filteredBoqCosts = useMemo(() => {
    if (!boqSearch.trim()) return costs;
    const q = boqSearch.trim().toLowerCase();
    return costs.filter(
      c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q)
    );
  }, [costs, boqSearch]);

  const filteredVarianceCosts = useMemo(() => {
    let list = costs;
    if (varianceFilter === 'material')
      list = list.filter(c => c.type === CostType.MATERIAL);
    else if (varianceFilter === 'labor')
      list = list.filter(c => c.type === CostType.LABOR);
    else if (varianceFilter === 'equipment')
      list = list.filter(c => c.type === CostType.EQUIPMENT);
    if (varianceSearch.trim()) {
      const q = varianceSearch.trim().toLowerCase();
      list = list.filter(
        c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.type || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [costs, varianceFilter, varianceSearch]);

  const filteredVarianceExpenses = useMemo(() => {
    const list = expensesResult.expenses || [];
    if (varianceFilter === 'material')
      return list.filter(
        (e: Expense) => (e.category || '').toUpperCase() === 'MATERIAL'
      );
    if (varianceFilter === 'labor')
      return list.filter(
        (e: Expense) => (e.category || '').toUpperCase() === 'LABOR'
      );
    if (varianceFilter === 'equipment')
      return list.filter(
        (e: Expense) => (e.category || '').toUpperCase() === 'EQUIPMENT'
      );
    if (varianceSearch.trim()) {
      const q = varianceSearch.trim().toLowerCase();
      return list.filter(
        (e: Expense) =>
          (e.name || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [expensesResult.expenses, varianceFilter, varianceSearch]);

  const siteUsageRows = useMemo(
    () =>
      costs.filter(
        c => Number(c.actualQty ?? 0) > 0 || Number(c.amountReceived ?? 0) > 0
      ),
    [costs]
  );
  const materialQtyVarianceRows = useMemo(
    () =>
      costs.filter(
        c =>
          (c.type || '').toString().toUpperCase() === CostType.MATERIAL &&
          (Number(c.estimatedQty ?? 0) > 0 ||
            Number(c.actualQty ?? 0) > 0 ||
            Number(c.amountReceived ?? 0) > 0)
      ),
    [costs]
  );
  const materialQtyVarianceSummary = useMemo(() => {
    const plannedQty = materialQtyVarianceRows.reduce(
      (sum, c) => sum + Number(c.estimatedQty ?? 0),
      0
    );
    const usedQty = materialQtyVarianceRows.reduce(
      (sum, c) => sum + Number(c.actualQty ?? 0),
      0
    );
    const unusedQty = Math.max(0, plannedQty - usedQty);
    const usagePct = plannedQty > 0 ? (usedQty / plannedQty) * 100 : 0;
    return { plannedQty, usedQty, unusedQty, usagePct };
  }, [materialQtyVarianceRows]);

  if (loading || !project) {
    return (
      <div
        style={{
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
          minHeight: 400,
          alignItems: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const statusCfg = statusConfig[project.status] || {
    color: 'default',
    label: project.status,
  };
  const projAny = project as any;
  const teamMembers = projAny.teamMembers ?? [];
  const costsSum = costs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const expensesSum = (expensesResult.expenses || []).reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );
  const budgetsTotal = budgets.reduce((s, b) => s + (Number(b.amount) ?? 0), 0);
  // API: GET /projects/:id → data.project.budget (decimal string); GET /projects/:id/budget-overview → data.budget, data.totalActualCost
  const rawBudget =
    (budgetOverview && Number(budgetOverview.budget) > 0
      ? Number(budgetOverview.budget)
      : null) ??
    (project.budget != null && Number(project.budget) > 0
      ? Number(project.budget)
      : null) ??
    (budgetsTotal > 0 ? budgetsTotal : 0);
  const budget = Number.isFinite(rawBudget) ? Number(rawBudget) : 0;
  // Prefer backend totalActualCost when > 0; else use sum of fetched expenses so logged expenses show as spent
  const rawSpent =
    Number(budgetOverview?.totalActualCost ?? 0) ||
    expensesSum ||
    Number(costOverview?.totalCosts ?? 0) ||
    costsSum ||
    0;
  const spent = Number.isFinite(rawSpent) ? Number(rawSpent) : 0;
  const remaining = Math.max(0, budget - spent);
  const pctUsed = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const projectLocation =
    project.location ??
    projAny.location ??
    projAny.address ??
    projAny.site_address ??
    '';
  const projectStartDate =
    project.startDate ?? projAny.start_date ?? projAny.planned_start_date ?? '';
  const projectEndDate =
    project.endDate ??
    project.plannedEndDate ??
    projAny.end_date ??
    projAny.planned_end_date ??
    '';

  const boqCount =
    costs.length ||
    expensesResult.expenses?.length ||
    (dashboardData?.pmbokCoreAreas?.cost?.count ??
      dashboardData?.budgetCount ??
      budgets.length);
  const expenseCount =
    budgetOverview?.expenseCount ??
    expensesResult.pagination?.totalItems ??
    expensesResult.expenses?.length ??
    (dashboardData as any)?.expenseCount ??
    0;
  const totalExpenseAmount = expensesSum;

  const goToCost = () => navigate('/pmbok/cost', { state: { projectId } });

  const totalBOQ =
    boqByCategory.material + boqByCategory.labor + boqByCategory.equipment ||
    budgets.reduce((s, b) => s + (b.amount ?? 0), 0);
  const rawEstimatedTotal =
    Number(costOverview?.totalBudget ?? 0) || budget || totalBOQ;
  const estimatedTotal = Number.isFinite(rawEstimatedTotal)
    ? Number(rawEstimatedTotal)
    : 0;
  const rawActualSpent = Number(costOverview?.totalCosts ?? 0) || spent;
  const actualSpent = Number.isFinite(rawActualSpent)
    ? Number(rawActualSpent)
    : 0;
  // Actual spend per category: from backend breakdown, or sum of (amountReceived / actualQty*unitCost) per BOQ line, or expenses
  const actualFromCosts = (type: string) => {
    const list = costs.filter(
      c => (c.type || '').toString().toUpperCase() === type
    );
    return list.reduce((s, c) => {
      const received =
        c.amountReceived ??
        Number(c.actualQty ?? 0) * Number(c.unitCost ?? c.amount ?? 0);
      return s + (received || 0);
    }, 0);
  };
  const actualByCat = {
    material:
      Number(costBreakdown?.actualMaterials ?? 0) ||
      actualFromCosts('MATERIAL') ||
      expensesByCategory.material,
    labor:
      Number(costBreakdown?.actualLabor ?? 0) ||
      actualFromCosts('LABOR') ||
      expensesByCategory.labor,
    equipment:
      Number(costBreakdown?.actualEquipment ?? 0) ||
      actualFromCosts('EQUIPMENT') ||
      expensesByCategory.equipment,
  };
  // When BOQ/costs don't set category budget (0), use project budget for categories that have actual spend so chart and cards show budget vs actual
  const materialBudget = Number.isFinite(boqByCategory.material)
    ? boqByCategory.material ||
      (actualByCat.material > 0 && budget > 0 ? budget : 0)
    : 0;
  const laborBudget = Number.isFinite(boqByCategory.labor)
    ? boqByCategory.labor || (actualByCat.labor > 0 && budget > 0 ? budget : 0)
    : 0;
  const equipmentBudget = Number.isFinite(boqByCategory.equipment)
    ? boqByCategory.equipment ||
      (actualByCat.equipment > 0 && budget > 0 ? budget : 0)
    : 0;
  const varianceChartData = [
    {
      category: 'Materials',
      budget: materialBudget,
      actual: actualByCat.material,
    },
    { category: 'Labor', budget: laborBudget, actual: actualByCat.labor },
    {
      category: 'Equipment',
      budget: equipmentBudget,
      actual: actualByCat.equipment,
    },
  ];
  const chartMax = Math.max(
    ...varianceChartData.map(d =>
      Math.max(Number(d.budget) || 0, Number(d.actual) || 0)
    ),
    1
  );

  const boqColumns: ColumnsType<Cost> = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag color="blue">{t || '—'}</Tag>,
    },
    {
      title: 'Trade',
      key: 'trade',
      render: (_, record) => (
        <Tag
          style={{
            background: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.16)',
            color: '#fff',
          }}
        >
          {getEffectiveTradeCategory(record, BOQ_TRADE_CATEGORIES)}
        </Tag>
      ),
    },
    {
      title: 'Unit',
      key: 'unit',
      render: (_, record) => (
        <Text style={{ color: '#bbb' }}>{record.unit?.trim() || '—'}</Text>
      ),
    },
    {
      title: 'Est. Qty',
      key: 'qty',
      render: (_, record) => {
        const qty = record.estimatedQty != null ? record.estimatedQty : 1;
        return <Text style={{ color: '#bbb' }}>{qty}</Text>;
      },
    },
    {
      title: 'Unit Cost',
      key: 'unitCost',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        return (
          <Text style={{ color: '#fff' }}>{formatCurrency(unitCost)}</Text>
        );
      },
    },
    {
      title: 'Total Amount',
      key: 'total',
      render: (_, record) => {
        const qty = record.estimatedQty != null ? record.estimatedQty : 1;
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        const total = qty * unitCost || record.amount;
        return (
          <Text style={{ color: '#00ff88' }}>{formatCurrency(total)}</Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            style={{ color: canEditBoqRow(record) ? '#009944' : '#666' }}
            disabled={!canEditBoqRow(record)}
            title={
              !canEditBoqRow(record)
                ? 'Approved or paid — only admin/proprietor can edit'
                : 'Edit BOQ item'
            }
            onClick={() => openEditBoqModal(record)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              Modal.confirm({
                title: 'Delete BOQ item?',
                content:
                  'This will remove the BOQ item from this project. This cannot be undone.',
                okText: 'Delete',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                  try {
                    await costService.deleteCost(record.id);
                    message.success('BOQ item deleted');
                    refetchCosts();
                  } catch (err: any) {
                    message.error(err.message || 'Failed to delete BOQ item');
                  }
                },
              });
            }}
          />
        </Space>
      ),
    },
  ];

  const varianceTableColumns: ColumnsType<Cost> = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => <Tag color="blue">{t || '—'}</Tag>,
    },
    {
      title: 'UNIT',
      key: 'unit',
      render: (_, record) => (
        <Text style={{ color: '#bbb' }}>{record.unit || '—'}</Text>
      ),
    },
    {
      title: 'Cost',
      key: 'unitCost',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        return (
          <Text style={{ color: '#fff' }}>{formatCurrency(unitCost)}</Text>
        );
      },
    },
    {
      title: 'Qty',
      key: 'qty',
      render: (_, record) => {
        const qty = record.estimatedQty != null ? record.estimatedQty : 0;
        return <Text style={{ color: '#bbb' }}>{qty}</Text>;
      },
    },
    {
      title: 'ACT Qty',
      key: 'actualQty',
      render: (_, record) => {
        const qty = record.actualQty != null ? record.actualQty : 0;
        return <Text style={{ color: '#bbb' }}>{qty}</Text>;
      },
    },
    {
      title: 'Qty Rem',
      key: 'qtyRem',
      render: (_, record) => {
        const planned = record.estimatedQty != null ? record.estimatedQty : 0;
        const used = record.actualQty != null ? record.actualQty : 0;
        const remaining = Math.max(0, planned - used);
        return <Text style={{ color: '#bbb' }}>{remaining}</Text>;
      },
    },
    {
      title: 'Qty Rem %',
      key: 'qtyRemPct',
      render: (_, record) => {
        const planned = record.estimatedQty || 0;
        const used = record.actualQty || 0;
        const remaining = Math.max(0, planned - used);
        const pct = planned > 0 ? Math.round((remaining / planned) * 100) : 100;
        return <Text style={{ color: '#bbb' }}>{pct}%</Text>;
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <Text style={{ color: '#00ff88' }}>
          {formatCurrency(record.amount)}
        </Text>
      ),
    },
    {
      title: 'Actual Amount',
      key: 'actualAmount',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        const qtyUsed = record.actualQty != null ? record.actualQty : 0;
        const amountFromUsage =
          record.amountReceived != null
            ? record.amountReceived
            : unitCost * qtyUsed;
        return (
          <Text style={{ color: '#bbb' }}>
            {formatCurrency(amountFromUsage)}
          </Text>
        );
      },
    },
    {
      title: 'Amount Rem',
      key: 'amountRem',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        const qtyRcvd = record.actualQty != null ? record.actualQty : 0;
        const amountRcvd =
          record.amountReceived != null
            ? record.amountReceived
            : unitCost * qtyRcvd;
        const amount = record.amount || 0;
        const remaining = Math.max(0, amount - amountRcvd);
        return (
          <Text style={{ color: '#bbb' }}>{formatCurrency(remaining)}</Text>
        );
      },
    },
    {
      title: 'Amount Rem %',
      key: 'amountRemPct',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        const qtyRcvd = record.actualQty != null ? record.actualQty : 0;
        const amountRcvd =
          record.amountReceived != null
            ? record.amountReceived
            : unitCost * qtyRcvd;
        const amount = record.amount || 0;
        const remaining = Math.max(0, amount - amountRcvd);
        const pct = amount > 0 ? Math.round((remaining / amount) * 100) : 100;
        return <Text style={{ color: '#bbb' }}>{pct}%</Text>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null ? record.unitCost : record.amount;
        const qtyRcvd = record.actualQty != null ? record.actualQty : 0;
        const amountRcvd =
          record.amountReceived != null
            ? record.amountReceived
            : unitCost * qtyRcvd;
        const amount = record.amount || 0;
        const remaining = Math.max(0, amount - amountRcvd);
        const remainingPct = amount > 0 ? (remaining / amount) * 100 : 100;

        let label: 'CRITICAL' | 'LOW' | 'OK' = 'OK';
        let color: string = 'green';
        if (remainingPct <= 10) {
          label = 'CRITICAL';
          color = 'red';
        } else if (remainingPct < 20) {
          label = 'LOW';
          color = 'orange';
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  const siteUsageColumns: ColumnsType<Cost> = [
    {
      title: 'Material',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text>,
    },
    {
      title: 'UNIT',
      key: 'unit',
      render: (_, record) => (
        <Text style={{ color: '#bbb' }}>{record.unit || '—'}</Text>
      ),
    },
    {
      title: 'Planned Qty',
      key: 'plannedQty',
      render: (_, record) => (
        <Text style={{ color: '#bbb' }}>{record.estimatedQty ?? 0}</Text>
      ),
    },
    {
      title: 'Used Qty',
      key: 'usedQty',
      render: (_, record) => (
        <Text style={{ color: '#fff' }}>{record.actualQty ?? 0}</Text>
      ),
    },
    {
      title: 'Remaining Qty',
      key: 'remainingQty',
      render: (_, record) => {
        const planned = Number(record.estimatedQty ?? 0);
        const used = Number(record.actualQty ?? 0);
        return (
          <Text style={{ color: '#bbb' }}>{Math.max(0, planned - used)}</Text>
        );
      },
    },
    {
      title: 'Actual Amount',
      key: 'actualAmount',
      render: (_, record) => {
        const unitCost =
          record.unitCost != null
            ? Number(record.unitCost)
            : Number(record.amount ?? 0);
        const used = Number(record.actualQty ?? 0);
        const amountFromUsage =
          record.amountReceived != null
            ? Number(record.amountReceived)
            : unitCost * used;
        return (
          <Text style={{ color: '#00ff88' }}>
            {formatCurrency(amountFromUsage)}
          </Text>
        );
      },
    },
  ];

  const materialQtyVarianceColumns: ColumnsType<Cost> = [
    {
      title: 'Material',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text>,
    },
    {
      title: 'UNIT',
      key: 'unit',
      render: (_, record) => (
        <Text style={{ color: '#bbb' }}>{record.unit || '—'}</Text>
      ),
    },
    {
      title: 'BOQ Qty',
      key: 'plannedQty',
      render: (_, record) => (
        <Text style={{ color: '#bbb' }}>
          {Number(record.estimatedQty ?? 0)}
        </Text>
      ),
    },
    {
      title: 'Used Qty',
      key: 'usedQty',
      render: (_, record) => (
        <Text style={{ color: '#fff' }}>{Number(record.actualQty ?? 0)}</Text>
      ),
    },
    {
      title: 'Unused Qty',
      key: 'unusedQty',
      render: (_, record) => {
        const planned = Number(record.estimatedQty ?? 0);
        const used = Number(record.actualQty ?? 0);
        return (
          <Text style={{ color: '#00ff88' }}>
            {Math.max(0, planned - used)}
          </Text>
        );
      },
    },
    {
      title: 'Usage %',
      key: 'usagePct',
      render: (_, record) => {
        const planned = Number(record.estimatedQty ?? 0);
        const used = Number(record.actualQty ?? 0);
        const pct = planned > 0 ? Math.min(999, (used / planned) * 100) : 0;
        return <Text style={{ color: '#bbb' }}>{`${pct.toFixed(1)}%`}</Text>;
      },
    },
  ];

  const expenseColumns: ColumnsType<Expense> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <Text style={{ color: '#fff' }}>{n || '—'}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <Text style={{ color: '#00ff88' }}>{formatCurrency(v)}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (d: string) => (
        <Text style={{ color: '#bbb' }}>
          {d ? dayjs(d).format('M/D/YYYY') : '—'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color="green">{s || '—'}</Tag>,
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card
              title="BOQ Items"
              style={{
                background: '#1f1f1f',
                border: '1px solid rgba(0,153,68,0.2)',
                borderRadius: 12,
                minHeight: 180,
              }}
              bodyStyle={{ padding: 24, textAlign: 'center', minHeight: 132 }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>
                {boqCount}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#00ff88', fontSize: 14 }}>
                  Total BOQ: {formatCurrency(totalBOQ || budget)}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              title="Total Expenses"
              style={{
                background: '#1f1f1f',
                border: '1px solid rgba(0,153,68,0.2)',
                borderRadius: 12,
                minHeight: 180,
              }}
              bodyStyle={{ padding: 24, textAlign: 'center', minHeight: 132 }}
            >
              <Text style={{ fontSize: 32, fontWeight: 700, color: '#ffffff' }}>
                {expenseCount}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#00ff88', fontSize: 14 }}>
                  Total: {formatCurrency(totalExpenseAmount)}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'boq',
      label: (
        <>
          BOQ <BankOutlined />
        </>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Typography.Title level={4} style={{ color: '#ffffff', margin: 0 }}>
              Bill of Quantities
            </Typography.Title>
            <Space wrap>
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => navigate(`/projects/${projectId}/boq-report`)}
                style={{ borderColor: 'rgba(0,153,68,0.5)', color: '#00ff88' }}
              >
                View BOQ report
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddBoqModal}
                style={{ background: '#009944', borderColor: '#009944' }}
              >
                Add Material
              </Button>
            </Space>
          </div>
          <Text
            style={{
              display: 'block',
              color: '#00ff88',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Total Project Budget (BOQ): {formatCurrency(totalBOQ || budget)}
          </Text>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(0,153,68,0.2)',
                  borderRadius: 12,
                  minHeight: 92,
                }}
                bodyStyle={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 92,
                }}
              >
                <Space>
                  <InboxOutlined style={{ color: '#009944' }} />
                  <Text strong style={{ color: '#fff' }}>
                    Material
                  </Text>
                </Space>
                <div
                  style={{
                    color: '#00ff88',
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {formatCurrency(boqByCategory.material)}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(0,153,68,0.2)',
                  borderRadius: 12,
                  minHeight: 92,
                }}
                bodyStyle={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 92,
                }}
              >
                <Space>
                  <UserOutlined style={{ color: '#009944' }} />
                  <Text strong style={{ color: '#fff' }}>
                    Labor
                  </Text>
                </Space>
                <div
                  style={{
                    color: '#00ff88',
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {formatCurrency(boqByCategory.labor)}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(0,153,68,0.2)',
                  borderRadius: 12,
                  minHeight: 92,
                }}
                bodyStyle={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 92,
                }}
              >
                <Space>
                  <ToolOutlined style={{ color: '#009944' }} />
                  <Text strong style={{ color: '#fff' }}>
                    Equipment
                  </Text>
                </Space>
                <div
                  style={{
                    color: '#00ff88',
                    fontSize: 18,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  {formatCurrency(boqByCategory.equipment)}
                </div>
              </Card>
            </Col>
          </Row>
          <Card
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
            }}
            bodyStyle={{ padding: 0 }}
          >
            {costs.length > 0 ? (
              <Table
                rowKey="id"
                dataSource={filteredBoqCosts}
                columns={boqColumns}
                pagination={{ pageSize: 10 }}
                size="small"
                style={{ background: 'transparent' }}
              />
            ) : expensesResult.expenses?.length > 0 ? (
              <>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    display: 'block',
                    padding: '16px 24px 0',
                  }}
                >
                  No BOQ cost items yet. Showing expenses below.
                </Text>
                <Table
                  rowKey="id"
                  dataSource={expensesResult.expenses}
                  columns={expenseColumns}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  style={{ background: 'transparent' }}
                />
                <Button
                  type="primary"
                  onClick={openAddBoqModal}
                  style={{
                    background: '#009944',
                    borderColor: '#009944',
                    margin: 16,
                  }}
                >
                  Add BOQ Item
                </Button>
              </>
            ) : (
              <>
                <Empty
                  description="No BOQ items yet. Add items below or log expenses in Expenses tab."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: 24 }}
                />
                <Button
                  type="primary"
                  onClick={openAddBoqModal}
                  style={{
                    background: '#009944',
                    borderColor: '#009944',
                    marginBottom: 16,
                  }}
                >
                  Add Material
                </Button>
              </>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'site-usage',
      label: (
        <>
          Site Usage <CarryOutOutlined />
        </>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <Card
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <Typography.Title
                level={4}
                style={{ color: '#ffffff', margin: 0 }}
              >
                Site Material Usage
              </Typography.Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setLogUsageModalOpen(true)}
                style={{ background: '#009944', borderColor: '#009944' }}
              >
                Log Usage
              </Button>
            </div>
            {siteUsageRows.length > 0 ? (
              <Table
                rowKey="id"
                dataSource={siteUsageRows}
                columns={siteUsageColumns}
                pagination={{ pageSize: 10 }}
                size="small"
                style={{ background: 'transparent' }}
              />
            ) : (
              <Empty
                description={
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ textAlign: 'center' }}
                  >
                    <Text style={{ color: '#b3b3b3', display: 'block' }}>
                      No material usage logged yet.
                    </Text>
                    <Text style={{ color: '#888', fontSize: 13 }}>
                      Log daily consumption to track variance.
                    </Text>
                  </Space>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 48 }}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'variance',
      label: (
        <>
          Variance <LineChartOutlined />
        </>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(0,153,68,0.2)',
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space>
                  <InboxOutlined style={{ color: '#009944' }} />
                  <Text strong style={{ color: '#fff' }}>
                    Materials
                  </Text>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    Budget:{' '}
                  </Text>
                  <Text style={{ color: '#009944', fontSize: 13 }}>
                    {formatCurrency(varianceChartData[0].budget)}
                  </Text>
                  <br />
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    Actual:{' '}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 13 }}>
                    {formatCurrency(varianceChartData[0].actual)}
                  </Text>
                  <br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>
                    {formatPctUsed(
                      varianceChartData[0].actual,
                      varianceChartData[0].budget
                    )}
                    % used
                  </Text>
                  <Text
                    style={{
                      color:
                        varianceChartData[0].actual >
                        varianceChartData[0].budget
                          ? '#ff4d4f'
                          : '#52c41a',
                      fontSize: 13,
                      marginLeft: 8,
                    }}
                  >
                    {varianceChartData[0].actual <= varianceChartData[0].budget
                      ? '+'
                      : ''}
                    {formatCurrency(
                      varianceChartData[0].budget - varianceChartData[0].actual
                    )}{' '}
                    variance
                  </Text>
                  <br />
                  <Tag
                    color={
                      varianceChartData[0].actual > varianceChartData[0].budget
                        ? 'red'
                        : 'green'
                    }
                    style={{ marginTop: 4 }}
                  >
                    {varianceChartData[0].actual > varianceChartData[0].budget
                      ? 'Over budget'
                      : 'On track'}
                  </Tag>
                  <Text
                    style={{
                      color: '#aaa',
                      fontSize: 11,
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    {boqByCategory.materialCount} items in BOQ
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(0,153,68,0.2)',
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space>
                  <UserOutlined style={{ color: '#009944' }} />
                  <Text strong style={{ color: '#fff' }}>
                    Labor
                  </Text>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    Budget:{' '}
                  </Text>
                  <Text style={{ color: '#009944', fontSize: 13 }}>
                    {formatCurrency(varianceChartData[1].budget)}
                  </Text>
                  <br />
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    Actual:{' '}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 13 }}>
                    {formatCurrency(varianceChartData[1].actual)}
                  </Text>
                  <br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>
                    {formatPctUsed(
                      varianceChartData[1].actual,
                      varianceChartData[1].budget
                    )}
                    % used
                  </Text>
                  <Text
                    style={{
                      color:
                        varianceChartData[1].actual >
                        varianceChartData[1].budget
                          ? '#ff4d4f'
                          : '#52c41a',
                      fontSize: 13,
                      marginLeft: 8,
                    }}
                  >
                    {varianceChartData[1].actual <= varianceChartData[1].budget
                      ? '+'
                      : ''}
                    {formatCurrency(
                      varianceChartData[1].budget - varianceChartData[1].actual
                    )}{' '}
                    variance
                  </Text>
                  <br />
                  <Tag
                    color={
                      varianceChartData[1].actual > varianceChartData[1].budget
                        ? 'red'
                        : 'green'
                    }
                    style={{ marginTop: 4 }}
                  >
                    {varianceChartData[1].actual > varianceChartData[1].budget
                      ? 'Over budget'
                      : 'On track'}
                  </Tag>
                  <Text
                    style={{
                      color: '#aaa',
                      fontSize: 11,
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    {boqByCategory.laborCount} items in BOQ
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                size="small"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid rgba(0,153,68,0.2)',
                  borderRadius: 12,
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space>
                  <ToolOutlined style={{ color: '#009944' }} />
                  <Text strong style={{ color: '#fff' }}>
                    Equipment
                  </Text>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    Budget:{' '}
                  </Text>
                  <Text style={{ color: '#009944', fontSize: 13 }}>
                    {formatCurrency(varianceChartData[2].budget)}
                  </Text>
                  <br />
                  <Text strong style={{ color: '#fff', fontSize: 12 }}>
                    Actual:{' '}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 13 }}>
                    {formatCurrency(varianceChartData[2].actual)}
                  </Text>
                  <br />
                  <Text style={{ color: '#00ff88', fontSize: 13 }}>
                    {formatPctUsed(
                      varianceChartData[2].actual,
                      varianceChartData[2].budget
                    )}
                    % used
                  </Text>
                  <Text
                    style={{
                      color:
                        varianceChartData[2].actual >
                        varianceChartData[2].budget
                          ? '#ff4d4f'
                          : '#52c41a',
                      fontSize: 13,
                      marginLeft: 8,
                    }}
                  >
                    {varianceChartData[2].actual <= varianceChartData[2].budget
                      ? '+'
                      : ''}
                    {formatCurrency(
                      varianceChartData[2].budget - varianceChartData[2].actual
                    )}{' '}
                    variance
                  </Text>
                  <br />
                  <Tag
                    color={
                      varianceChartData[2].actual > varianceChartData[2].budget
                        ? 'red'
                        : 'green'
                    }
                    style={{ marginTop: 4 }}
                  >
                    {varianceChartData[2].actual > varianceChartData[2].budget
                      ? 'Over budget'
                      : 'On track'}
                  </Tag>
                  <Text
                    style={{
                      color: '#aaa',
                      fontSize: 11,
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    {boqByCategory.equipmentCount} items in BOQ
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
          <Card
            title="Budget vs Actual by Category"
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <ChartErrorBoundary height={280}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={varianceChartData}
                  margin={{ top: 16, right: 24, left: 48, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#bbb', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, chartMax]}
                    tick={{ fill: '#bbb', fontSize: 11 }}
                    tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1f1f1f',
                      border: '1px solid rgba(0,153,68,0.3)',
                    }}
                    formatter={(v: number) => [formatCurrency(v), '']}
                  />
                  <Legend />
                  <Bar
                    dataKey="budget"
                    name="Budget"
                    fill="#009944"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actual"
                    name="Actual"
                    fill="#888"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartErrorBoundary>
          </Card>
          <Card
            title="Material Quantity Variance (BOQ vs Site Usage)"
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
              marginBottom: 24,
            }}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Total BOQ Qty
                  </Text>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {materialQtyVarianceSummary.plannedQty.toFixed(2)}
                  </div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Total Used Qty
                  </Text>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {materialQtyVarianceSummary.usedQty.toFixed(2)}
                  </div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Total Unused Qty
                  </Text>
                  <div style={{ color: '#00ff88', fontWeight: 600 }}>
                    {materialQtyVarianceSummary.unusedQty.toFixed(2)}
                  </div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Usage Rate
                  </Text>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {materialQtyVarianceSummary.usagePct.toFixed(1)}%
                  </div>
                </Card>
              </Col>
            </Row>
            {materialQtyVarianceRows.length > 0 ? (
              <Table
                rowKey="id"
                dataSource={materialQtyVarianceRows}
                columns={materialQtyVarianceColumns}
                pagination={{ pageSize: 5 }}
                size="small"
                style={{ background: 'transparent' }}
              />
            ) : (
              <Empty
                description="No BOQ material quantity data yet."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 24 }}
              />
            )}
          </Card>
          <Card
            title="Detailed Variance Report"
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
            }}
          >
            <Space size="small" style={{ marginBottom: 16 }}>
              {(['all', 'material', 'labor', 'equipment'] as const).map(k => (
                <Button
                  key={k}
                  type={varianceFilter === k ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setVarianceFilter(k)}
                  style={
                    varianceFilter === k
                      ? { background: '#009944', borderColor: '#009944' }
                      : {}
                  }
                >
                  {k === 'all'
                    ? 'All'
                    : k === 'material'
                      ? 'Materials'
                      : k === 'labor'
                        ? 'Labor'
                        : 'Equipment'}
                </Button>
              ))}
            </Space>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Project Budget
                  </Text>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {formatCurrency(budget)}
                  </div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Estimated (BOQ)
                  </Text>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {formatCurrency(estimatedTotal)}
                  </div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>
                    Actual Spent
                  </Text>
                  <div style={{ color: '#fff', fontWeight: 600 }}>
                    {formatCurrency(actualSpent)}
                  </div>
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card size="small" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>Remaining</Text>
                  <div style={{ color: '#00ff88', fontWeight: 600 }}>
                    {formatCurrency(Math.max(0, estimatedTotal - actualSpent))}
                  </div>
                </Card>
              </Col>
            </Row>
            <Input
              placeholder="Search items..."
              value={varianceSearch}
              onChange={e => setVarianceSearch(e.target.value)}
              style={{ marginBottom: 12, background: '#141414', color: '#fff' }}
              allowClear
            />
            {filteredVarianceCosts.length > 0 ? (
              <>
                <Text
                  style={{
                    color: '#aaa',
                    fontSize: 12,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  BOQ items (budget). Item-level actuals may be 0 until linked
                  to expenses.
                </Text>
                <Table
                  rowKey="id"
                  dataSource={filteredVarianceCosts}
                  columns={varianceTableColumns}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  style={{ background: 'transparent' }}
                />
                {(expensesResult.expenses?.length ?? 0) > 0 && (
                  <>
                    <Text
                      strong
                      style={{
                        color: '#fff',
                        display: 'block',
                        marginTop: 24,
                        marginBottom: 8,
                      }}
                    >
                      Actual spend (from logged expenses)
                    </Text>
                    <Text
                      style={{
                        color: '#aaa',
                        fontSize: 12,
                        display: 'block',
                        marginBottom: 8,
                      }}
                    >
                      These logged expenses make up the &quot;Actual Spent&quot;
                      total above. Sum of listed expenses below.
                    </Text>
                    {(() => {
                      const varianceReportExpenses =
                        varianceFilter === 'all'
                          ? expensesResult.expenses || []
                          : filteredVarianceExpenses;
                      const varianceReportExpensesSum =
                        varianceReportExpenses.reduce(
                          (s, e) => s + (Number((e as Expense).amount) || 0),
                          0
                        );
                      return (
                        <Table
                          rowKey="id"
                          dataSource={varianceReportExpenses}
                          columns={expenseColumns}
                          pagination={{ pageSize: 5 }}
                          size="small"
                          style={{ background: 'transparent' }}
                          summary={() => (
                            <Table.Summary fixed>
                              <Table.Summary.Row>
                                <Table.Summary.Cell index={0}>
                                  <Text strong style={{ color: '#fff' }}>
                                    Total (listed)
                                  </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1}>
                                  <Text strong style={{ color: '#00ff88' }}>
                                    {formatCurrency(varianceReportExpensesSum)}
                                  </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} colSpan={2} />
                              </Table.Summary.Row>
                            </Table.Summary>
                          )}
                        />
                      );
                    })()}
                  </>
                )}
              </>
            ) : filteredVarianceExpenses.length > 0 ? (
              <>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    display: 'block',
                    marginBottom: 12,
                  }}
                >
                  Showing expenses (no BOQ cost items yet).
                </Text>
                <Table
                  rowKey="id"
                  dataSource={filteredVarianceExpenses}
                  columns={expenseColumns}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  style={{ background: 'transparent' }}
                />
              </>
            ) : (
              <Empty
                description="No variance items. Log expenses in the Expenses tab."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 24 }}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'expenses',
      label: (
        <>
          Expenses <FundOutlined />
        </>
      ),
      children: (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <Typography.Title level={4} style={{ color: '#ffffff', margin: 0 }}>
              Project Expenses
            </Typography.Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setLogExpenseModalOpen(true)}
              style={{ background: '#009944', borderColor: '#009944' }}
            >
              Log Expense
            </Button>
          </div>
          <Card
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
            }}
          >
            {expensesResult.expenses?.length > 0 ? (
              <>
                <Table
                  rowKey="id"
                  dataSource={expensesResult.expenses}
                  columns={expenseColumns}
                  pagination={false}
                  size="small"
                  style={{ background: 'transparent' }}
                />
                {(expensesResult.pagination?.totalItems ?? 0) >
                  (expensesResult.expenses?.length ?? 0) && (
                  <Text
                    style={{ color: '#aaa', display: 'block', marginTop: 8 }}
                  >
                    Showing {expensesResult.expenses?.length ?? 0} of{' '}
                    {expensesResult.pagination?.totalItems ?? 0} expenses
                  </Text>
                )}
                <Button
                  type="link"
                  icon={<RightOutlined />}
                  onClick={goToCost}
                  style={{ color: '#009944', marginTop: 8 }}
                >
                  View all in Cost Management
                </Button>
              </>
            ) : (
              <Empty
                description="No expenses found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: 48 }}
              >
                <Button
                  type="primary"
                  onClick={() => setLogExpenseModalOpen(true)}
                  style={{ background: '#009944', borderColor: '#009944' }}
                >
                  Log Expense
                </Button>
              </Empty>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'ai-assistant',
      label: <Badge dot={hasUnreviewedAiRisks}>NUKI</Badge>,
      children: (
        <div style={{ marginTop: 16 }}>
          <ProjectAIChat
            key={`${user?.id || 'anon'}:${projectId}`}
            projectId={projectId!}
            onActionExecuted={refreshAfterAiAction}
          />
        </div>
      ),
    },
  ];

  return (
    <div
      style={{ padding: '24px', background: 'transparent', minHeight: '100vh' }}
    >
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/projects')}
        style={{ color: '#009944', marginBottom: 16, padding: 0 }}
      >
        Back to Projects
      </Button>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 8,
          }}
        >
          <Typography.Title level={2} style={{ color: '#ffffff', margin: 0 }}>
            {project.name}
          </Typography.Title>
          <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
        </div>
        {project.clientName && (
          <Text style={{ color: '#aaa', fontSize: 14 }}>
            {project.clientName}
          </Text>
        )}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card
            title="Project Details"
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
              minHeight: 220,
            }}
            bodyStyle={{ padding: 20, minHeight: 168 }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {projectLocation || '—'}
              </Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Started:{' '}
                {projectStartDate
                  ? dayjs(projectStartDate).format('M/D/YYYY')
                  : '—'}
              </Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                Due:{' '}
                {projectEndDate
                  ? dayjs(projectEndDate).format('M/D/YYYY')
                  : '—'}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title="Budget Overview"
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
              minHeight: 220,
            }}
            bodyStyle={{ padding: 20, minHeight: 168 }}
          >
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 600 }}>
                {formatCurrency(budget)}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>
                Spent: {formatCurrency(spent)}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 13 }}>
                Committed (BOQ): {formatCurrency(totalBOQ || budget)}
              </Text>
              <Text style={{ color: '#00ff88', fontSize: 15, fontWeight: 600 }}>
                Remaining: {formatCurrency(remaining)}
              </Text>
              <Progress
                percent={pctUsed}
                strokeColor="#009944"
                showInfo={false}
                size="small"
              />
              <Text style={{ color: '#00ff88', fontSize: 12 }}>
                {pctUsed}% used
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            title={
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                Team Members
                <TeamOutlined />
              </span>
            }
            style={{
              background: '#1f1f1f',
              border: '1px solid rgba(0,153,68,0.2)',
              borderRadius: 12,
              minHeight: 220,
            }}
            bodyStyle={{ padding: 20, minHeight: 168 }}
          >
            {teamMembers.length === 0 ? (
              <Text style={{ color: '#aaa', fontSize: 13 }}>
                No team members assigned
              </Text>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 20, color: '#bbb' }}>
                {teamMembers.map((m: any) => (
                  <li key={m.id}>
                    {(m.user?.firstName ?? '') + ' ' + (m.user?.lastName ?? '')}
                  </li>
                ))}
              </ul>
            )}
            <Select
              placeholder="Add team member..."
              allowClear
              style={{ width: '100%', marginTop: 12 }}
              suffixIcon={null}
              dropdownStyle={{ background: '#1f1f1f' }}
            >
              <Option value="" disabled>
                Add team member...
              </Option>
            </Select>
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="overview"
        items={tabItems}
        style={{ color: '#fff' }}
      />

      <BOQItemModal
        open={boqModalOpen}
        mode={editingCost ? 'edit' : 'add'}
        projectId={projectId!}
        editingCost={editingCost}
        onClose={closeBoqModal}
        onSaved={savedCost => {
          if (savedCost && !editingCost) {
            setCosts(prev => [
              ...prev,
              { ...savedCost, projectId: projectId! },
            ]);
          } else if (savedCost && editingCost) {
            setCosts(prev =>
              prev.map(c =>
                c.id === savedCost.id
                  ? { ...savedCost, projectId: projectId! }
                  : c
              )
            );
          }
          refetchCosts();
        }}
      />

      <Modal
        title="Log Material Usage"
        open={logUsageModalOpen}
        onCancel={() => setLogUsageModalOpen(false)}
        footer={null}
        width={480}
        destroyOnClose
        styles={{
          content: {
            background: '#1f1f1f',
            border: '1px solid rgba(0,153,68,0.2)',
          },
          header: { background: '#1f1f1f' },
        }}
      >
        <Form
          form={logUsageForm}
          layout="vertical"
          onFinish={async values => {
            if (!projectId) return;
            const costId = values.material;
            const quantityUsed = Number(values.quantityUsed) || 0;
            const dateUsed = values.dateUsed
              ? dayjs(values.dateUsed).format('YYYY-MM-DD')
              : dayjs().format('YYYY-MM-DD');
            const notes = values.notes?.trim() || undefined;
            try {
              await costService.createSiteUsage({
                projectId,
                costId,
                quantityUsed,
                date: dateUsed,
                notes,
              });
              message.success('Usage logged');
              setLogUsageModalOpen(false);
              logUsageForm.resetFields();
              refetchCosts();
            } catch (err: any) {
              message.error(err.message || 'Failed to log usage');
            }
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="material"
            label={<span style={{ color: '#d9d9d9' }}>Material *</span>}
            rules={[{ required: true, message: 'Select material' }]}
          >
            <Select
              placeholder="Select material"
              allowClear
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1f1f1f' }}
              optionFilterProp="label"
              options={costs.map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item
            name="quantityUsed"
            label={<span style={{ color: '#d9d9d9' }}>Quantity Used *</span>}
            rules={[{ required: true, message: 'Enter quantity' }]}
            initialValue={0}
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{
                width: '100%',
                background: '#2a2a2a',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
              }}
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item
            name="dateUsed"
            label={<span style={{ color: '#d9d9d9' }}>Date Used *</span>}
            rules={[{ required: true, message: 'Select date' }]}
            initialValue={dayjs()}
          >
            <DatePicker
              style={{
                width: '100%',
                background: '#2a2a2a',
                borderColor: 'rgba(255,255,255,0.15)',
              }}
              format="MMM D, YYYY"
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label={<span style={{ color: '#d9d9d9' }}>Notes</span>}
          >
            <Input.TextArea
              rows={3}
              placeholder="Optional notes (e.g., work area, reason)..."
              style={{
                background: '#2a2a2a',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                resize: 'none',
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setLogUsageModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ background: '#009944', borderColor: '#009944' }}
              >
                Log Usage
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Log Expense modal — in-place, no redirect */}
      <Modal
        open={logExpenseModalOpen}
        title={
          <div>
            <Text strong style={{ color: '#fff', display: 'block' }}>
              Log Expense
            </Text>
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
              Record a new expense for a project.
            </Text>
          </div>
        }
        onCancel={() => {
          setLogExpenseModalOpen(false);
          logExpenseForm.resetFields();
        }}
        footer={null}
        width={560}
        destroyOnClose
        styles={{
          content: {
            background: '#1f1f1f',
            border: '1px solid rgba(0,153,68,0.2)',
          },
          header: { background: '#1f1f1f' },
        }}
      >
        <Form
          form={logExpenseForm}
          layout="vertical"
          onFinish={handleLogExpenseSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="projectId"
            label={<Text style={{ color: '#d9d9d9' }}>Project *</Text>}
          >
            <Select
              disabled
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1f1f1f' }}
              options={
                project
                  ? [
                      {
                        label: project.name || 'Current project',
                        value: projectId,
                      },
                    ]
                  : []
              }
            />
          </Form.Item>
          <Form.Item
            name="costId"
            label={
              <Text style={{ color: '#d9d9d9' }}>
                Budget Allocation (Optional)
              </Text>
            }
          >
            <Select
              allowClear
              placeholder="Link to BOQ item..."
              style={{ width: '100%' }}
              dropdownStyle={{ background: '#1f1f1f' }}
              optionFilterProp="label"
              options={costs.map(c => ({
                label: `${c.name || 'Item'} — ${c.type || '—'} — ${formatCurrency(c.amount ?? 0)}`,
                value: c.id,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label={<Text style={{ color: '#d9d9d9' }}>Category *</Text>}
                rules={[{ required: true, message: 'Select category' }]}
              >
                <Select
                  placeholder="Select category"
                  style={{ width: '100%' }}
                  dropdownStyle={{ background: '#1f1f1f' }}
                  options={Object.values(ExpenseCategory).map(c => ({
                    label: c,
                    value: c,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label={<Text style={{ color: '#d9d9d9' }}>Amount (₱) *</Text>}
                rules={[{ required: true, message: 'Enter amount' }]}
              >
                <InputNumber
                  min={0.01}
                  precision={2}
                  placeholder="0"
                  style={{
                    width: '100%',
                    background: '#2a2a2a',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="vendor"
            label={<Text style={{ color: '#d9d9d9' }}>Vendor/Supplier</Text>}
          >
            <Input
              placeholder="e.g. Home Depot"
              style={{
                background: '#2a2a2a',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
              }}
            />
          </Form.Item>
          <Form.Item
            name="date"
            label={<Text style={{ color: '#d9d9d9' }}>Date *</Text>}
            rules={[{ required: true, message: 'Select date' }]}
          >
            <DatePicker
              style={{
                width: '100%',
                background: '#2a2a2a',
                borderColor: 'rgba(255,255,255,0.15)',
              }}
              format="MM/DD/YYYY"
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label={<Text style={{ color: '#d9d9d9' }}>Notes</Text>}
          >
            <TextArea
              rows={3}
              placeholder="Additional details about this expense..."
              style={{
                background: '#2a2a2a',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#fff',
                resize: 'none',
              }}
            />
          </Form.Item>
          <Form.Item
            label={<Text style={{ color: '#d9d9d9' }}>Receipt (optional)</Text>}
          >
            <Upload
              beforeUpload={file => {
                if (file.size > 5 * 1024 * 1024) {
                  message.error('File must be under 5 MB');
                  return false;
                }
                setLogExpenseReceiptFile(file);
                setLogExpenseFileList([
                  { uid: file.name, name: file.name, status: 'done' },
                ]);
                return false;
              }}
              onRemove={() => {
                setLogExpenseReceiptFile(null);
                setLogExpenseFileList([]);
              }}
              fileList={logExpenseFileList}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              maxCount={1}
            >
              <Button
                icon={<UploadOutlined />}
                style={{ color: '#009944', borderColor: '#009944' }}
              >
                Upload Receipt
              </Button>
            </Upload>
            <Text style={{ color: '#595959', fontSize: 11 }}>
              JPG, PNG, WebP, or PDF. Max 5MB.
            </Text>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setLogExpenseModalOpen(false);
                  logExpenseForm.resetFields();
                }}
                disabled={logExpenseSaving}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={logExpenseSaving}
                style={{ background: '#ff8c00', borderColor: '#ff8c00' }}
              >
                Log Expense
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
