import { apiService } from './api';

// ---- Enums ----

export enum CostType {
  MATERIAL = 'MATERIAL',
  LABOR = 'LABOR',
  EQUIPMENT = 'EQUIPMENT',
  FUEL = 'FUEL',
  FORMWORKS = 'FORMWORKS',
  OVERHEAD = 'OVERHEAD',
  OTHER = 'OTHER',
}

export enum BudgetStatus {
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  CLOSED = 'CLOSED',
  REVISED = 'REVISED',
}

export enum ExpenseCategory {
  MATERIAL = 'MATERIAL',
  LABOR = 'LABOR',
  EQUIPMENT = 'EQUIPMENT',
  OVERHEAD = 'OVERHEAD',
  SUBCONTRACTOR = 'SUBCONTRACTOR',
  PERMITS = 'PERMITS',
  OTHER = 'OTHER',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

// ---- Interfaces ----

export interface Cost {
  id: string;
  name: string;
  type: CostType;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
  projectId?: string;
  taskId?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCostData {
  name: string;
  type: CostType;
  amount: number;
  date: string;
  currency?: string;
  description?: string;
  projectId?: string;
  taskId?: string;
}

export interface CostSummary {
  total: number;
  byType: Record<string, number>;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  projectId: string;
  currency?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  contingency?: number;
  managementReserve?: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetData {
  name: string;
  amount: number;
  projectId: string;
  currency?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  contingency?: number;
  managementReserve?: number;
}

export interface BudgetUtilization {
  budgetId: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
}

export interface ExpenseAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ExpenseRelatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ExpenseRelatedProject {
  id: string;
  name: string;
}

export interface ExpenseRelatedBudget {
  id: string;
  name: string;
  amount: number;
}

export interface Expense {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  subcategory?: string | null;
  date: string;
  status: ExpenseStatus;
  vendor?: string | null;
  invoiceNumber?: string | null;
  receiptNumber?: string | null;
  projectId: string;
  taskId?: string | null;
  budgetId?: string | null;
  submittedBy?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  attachments?: ExpenseAttachment[] | null;
  notes?: string | null;
  tags?: string[] | null;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Included associations
  project?: ExpenseRelatedProject;
  budget?: ExpenseRelatedBudget | null;
  submitter?: ExpenseRelatedUser;
  approver?: ExpenseRelatedUser | null;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  budgetId?: string;
  taskId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  vendor?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ExpensePagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedExpensesResponse {
  expenses: Expense[];
  pagination: ExpensePagination;
}

export interface CreateExpenseData {
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  projectId: string;
  budgetId?: string;
  taskId?: string;
  vendor?: string;
  invoiceNumber?: string;
  description?: string;
}

export interface ExpenseSummary {
  projectId: string;
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

// Analysis response types (loose — test actual shapes)
export interface CostOverview {
  projectId: string;
  totalBudget: number;
  totalCosts: number;
  totalExpenses: number;
  variance: number;
  [key: string]: any;
}

export interface EVMData {
  projectId: string;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  spi: number;
  cpi: number;
  [key: string]: any;
}

export interface CostBreakdown {
  [key: string]: any;
}

export interface CostTrend {
  [key: string]: any;
}

export interface CostForecast {
  eac: number;
  etc: number;
  vac: number;
  tcpi: number;
  [key: string]: any;
}

// ---- API Response wrapper ----

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class CostService {
  // ==================== COSTS ====================

  // POST /api/cost/costs — body: { name, type, amount, date, projectId?, description? }
  // type required, one of: MATERIAL, LABOR, EQUIPMENT, OVERHEAD, OTHER, FUEL, FORMWORKS (case-insensitive; stored uppercase)
  async createCost(data: CreateCostData): Promise<Cost> {
    try {
      const response = await apiService.post<ApiResponse<Cost>>('/cost/costs', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create cost');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create cost');
    }
  }

  // GET /api/cost/costs — normalize projectId and type (API may return project_id, type in any case)
  async getCosts(): Promise<Cost[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>('/cost/costs');
      if (!response.data.success) return [];
      const d = response.data.data;
      const raw = (d?.costs && Array.isArray(d.costs)) ? d.costs : (Array.isArray(d) ? d : []);
      return raw.map((c: any) => ({
        ...c,
        projectId: c.projectId ?? c.project_id,
        type: (c.type != null && c.type !== '') ? String(c.type).toUpperCase() : c.type,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch costs');
    }
  }

  // GET /api/cost/costs/summary
  async getCostsSummary(): Promise<CostSummary | null> {
    try {
      const response = await apiService.get<ApiResponse<CostSummary>>('/cost/costs/summary');
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch costs summary');
    }
  }

  // GET /api/cost/costs/:id
  async getCostById(id: string): Promise<Cost | null> {
    try {
      const response = await apiService.get<ApiResponse<Cost>>(`/cost/costs/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost');
    }
  }

  // PUT /api/cost/costs/:id
  async updateCost(id: string, data: Partial<CreateCostData>): Promise<Cost> {
    try {
      const response = await apiService.put<ApiResponse<Cost>>(`/cost/costs/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update cost');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update cost');
    }
  }

  // DELETE /api/cost/costs/:id
  async deleteCost(id: string): Promise<void> {
    try {
      await apiService.delete(`/cost/costs/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete cost');
    }
  }

  // PATCH /api/cost/costs/:id/status
  async updateCostStatus(id: string, status: string): Promise<Cost> {
    try {
      const response = await apiService.patch<ApiResponse<Cost>>(`/cost/costs/${id}/status`, { status });
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update cost status');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update cost status');
    }
  }

  // ==================== BUDGETS ====================

  // POST /api/cost/budgets
  async createBudget(data: CreateBudgetData): Promise<Budget> {
    try {
      const response = await apiService.post<ApiResponse<Budget>>('/cost/budgets', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
  }

  // GET /api/cost/budgets — optional ?projectId= for filter. API returns data: { budgets, pagination }.
  async getBudgets(projectId?: string): Promise<Budget[]> {
    try {
      const params = projectId ? { projectId } : undefined;
      const response = await apiService.get<ApiResponse<{ budgets?: Budget[]; pagination?: any }>>('/cost/budgets', { params });
      if (response.data.success) {
        const d = response.data.data;
        const list = d?.budgets && Array.isArray(d.budgets) ? d.budgets : Array.isArray(d) ? d : [];
        return list.map((b: any) => ({ ...b, amount: Number(b.amount) || 0 }));
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }

  // GET /api/cost/budgets/:id
  async getBudgetById(id: string): Promise<Budget | null> {
    try {
      const response = await apiService.get<ApiResponse<Budget>>(`/cost/budgets/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
  }

  // PUT /api/cost/budgets/:id
  async updateBudget(id: string, data: Partial<CreateBudgetData>): Promise<Budget> {
    try {
      const response = await apiService.put<ApiResponse<Budget>>(`/cost/budgets/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
  }

  // DELETE /api/cost/budgets/:id
  async deleteBudget(id: string): Promise<void> {
    try {
      await apiService.delete(`/cost/budgets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
  }

  // PATCH /api/cost/budgets/:id/approve
  async approveBudget(id: string): Promise<Budget> {
    try {
      const response = await apiService.patch<ApiResponse<Budget>>(`/cost/budgets/${id}/approve`, {});
      if (response.data.success) return response.data.data;
      throw new Error('Failed to approve budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve budget');
    }
  }

  // POST /api/cost/budgets/:id/revise
  async reviseBudget(id: string, data: Partial<CreateBudgetData>): Promise<Budget> {
    try {
      const response = await apiService.post<ApiResponse<Budget>>(`/cost/budgets/${id}/revise`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to revise budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to revise budget');
    }
  }

  // PATCH /api/cost/budgets/:id/close
  async closeBudget(id: string): Promise<Budget> {
    try {
      const response = await apiService.patch<ApiResponse<Budget>>(`/cost/budgets/${id}/close`, {});
      if (response.data.success) return response.data.data;
      throw new Error('Failed to close budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to close budget');
    }
  }

  // GET /api/cost/budgets/:id/utilization
  async getBudgetUtilization(id: string): Promise<BudgetUtilization | null> {
    try {
      const response = await apiService.get<ApiResponse<BudgetUtilization>>(`/cost/budgets/${id}/utilization`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget utilization');
    }
  }

  // ==================== EXPENSES ====================

  // POST /api/cost/expenses
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    try {
      const response = await apiService.post<ApiResponse<Expense>>('/cost/expenses', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create expense');
    }
  }

  // GET /api/cost/expenses
  async getExpenses(): Promise<Expense[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>('/cost/expenses');
      if (response.data.success) {
        const d = response.data.data;
        if (d?.expenses && Array.isArray(d.expenses)) return d.expenses;
        if (Array.isArray(d)) return d;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }

  // GET /api/cost/expenses/:id
  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const response = await apiService.get<ApiResponse<Expense>>(`/cost/expenses/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expense');
    }
  }

  // PUT /api/cost/expenses/:id
  async updateExpense(id: string, data: Partial<CreateExpenseData>): Promise<Expense> {
    try {
      const response = await apiService.put<ApiResponse<Expense>>(`/cost/expenses/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update expense');
    }
  }

  // DELETE /api/cost/expenses/:id
  async deleteExpense(id: string): Promise<void> {
    try {
      await apiService.delete(`/cost/expenses/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete expense');
    }
  }

  // PATCH /api/cost/expenses/:id/approve
  async approveExpense(id: string): Promise<Expense> {
    try {
      const response = await apiService.patch<ApiResponse<Expense>>(`/cost/expenses/${id}/approve`, {});
      if (response.data.success) return response.data.data;
      throw new Error('Failed to approve expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve expense');
    }
  }

  // PATCH /api/cost/expenses/:id/reject — reason REQUIRED
  async rejectExpense(id: string, reason: string): Promise<Expense> {
    try {
      const response = await apiService.patch<ApiResponse<Expense>>(`/cost/expenses/${id}/reject`, { reason });
      if (response.data.success) return response.data.data;
      throw new Error('Failed to reject expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject expense');
    }
  }

  // PATCH /api/cost/expenses/:id/pay
  async payExpense(id: string): Promise<Expense> {
    try {
      const response = await apiService.patch<ApiResponse<Expense>>(`/cost/expenses/${id}/pay`, {});
      if (response.data.success) return response.data.data;
      throw new Error('Failed to mark expense as paid');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark expense as paid');
    }
  }

  // POST /api/cost/expenses/bulk-approve
  async bulkApproveExpenses(expenseIds: string[], notes?: string): Promise<void> {
    try {
      await apiService.post('/cost/expenses/bulk-approve', { expenseIds, notes });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk approve expenses');
    }
  }

  // GET /api/cost/expenses (paginated + filterable)
  async getExpensesPaginated(filters: ExpenseFilters = {}): Promise<PaginatedExpensesResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && (v as unknown) !== '') params.append(k, String(v));
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiService.get<ApiResponse<PaginatedExpensesResponse>>(`/cost/expenses${query}`);
      if (!response.data?.success) return { expenses: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false, hasPrev: false } };
      const d = response.data.data;
      if (d?.expenses && Array.isArray(d.expenses)) return { expenses: d.expenses, pagination: d.pagination ?? { currentPage: 1, totalPages: 0, totalItems: d.expenses.length, hasNext: false, hasPrev: false } };
      if (Array.isArray(d)) return { expenses: d, pagination: { currentPage: 1, totalPages: 0, totalItems: d.length, hasNext: false, hasPrev: false } };
      return { expenses: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, hasNext: false, hasPrev: false } };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }

  // POST /api/cost/expenses/:id/receipts — multipart/form-data, field: 'receipt'
  async uploadReceipt(expenseId: string, file: File): Promise<Expense> {
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      // Passing FormData — Axios auto-sets Content-Type with boundary
      const response = await apiService.post<ApiResponse<Expense>>(
        `/cost/expenses/${expenseId}/receipts`,
        formData
      );
      if (response.data.success) return response.data.data;
      throw new Error('Failed to upload receipt');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload receipt');
    }
  }

  // DELETE /api/cost/expenses/:id/receipts/:index — 0-based index
  async deleteReceipt(expenseId: string, index: number): Promise<Expense> {
    try {
      const response = await apiService.delete<ApiResponse<Expense>>(`/cost/expenses/${expenseId}/receipts/${index}`);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to delete receipt');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete receipt');
    }
  }

  /** Build the full URL for serving a receipt file */
  getReceiptUrl(attachment: ExpenseAttachment): string {
    if (/^https?:\/\//i.test(attachment.url)) {
      return attachment.url;
    }

    const baseUrl = apiService.getBaseURL().replace(/\/+$/, '');
    const backendBase = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;
    const normalizedPath = attachment.url.startsWith('/') ? attachment.url : `/${attachment.url}`;

    return `${backendBase}${normalizedPath}`;
  }

  // GET /api/cost/expenses/summary/:projectId
  async getExpenseSummary(projectId: string): Promise<ExpenseSummary | null> {
    try {
      const response = await apiService.get<ApiResponse<ExpenseSummary>>(`/cost/expenses/summary/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expense summary');
    }
  }

  // ==================== ANALYSIS ====================

  // GET /api/cost/analysis/compare?projectIds=id1,id2
  async compareCosts(projectIds: string[]): Promise<any> {
    try {
      const response = await apiService.get<ApiResponse<any>>(
        `/cost/analysis/compare?projectIds=${projectIds.join(',')}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to compare costs');
    }
  }

  // GET /api/cost/analysis/overview/:projectId
  // GET /api/cost/analysis/overview/:projectId — data has overview: { totalBudget, totalApproved, totalPending, totalPaid, ... }
  async getCostOverview(projectId: string): Promise<CostOverview | null> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/cost/analysis/overview/${projectId}`);
      if (!response.data.success || !response.data.data) return null;
      const data = response.data.data;
      const ov = data.overview || data;
      const totalCosts =
        Number(ov.totalActualCost ?? ov.totalCosts ?? 0) ||
        (Number(ov.totalApproved ?? 0) + Number(ov.totalPending ?? 0) + Number(ov.totalPaid ?? 0));
      return {
        projectId: data.projectId ?? projectId,
        totalBudget: Number(ov.totalBudget ?? 0),
        totalCosts,
        totalExpenses: data.expenseCount ?? 0,
        variance: Number(ov.costVariance ?? ov.remaining ?? 0),
        budgetCount: data.budgetCount,
        expenseCount: data.expenseCount,
      } as CostOverview;
    } catch (error: any) {
      return null;
    }
  }

  // GET /api/cost/analysis/evm/:projectId
  async getEVM(projectId: string): Promise<EVMData | null> {
    try {
      const response = await apiService.get<ApiResponse<EVMData>>(`/cost/analysis/evm/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch EVM data');
    }
  }

  // GET /api/cost/analysis/breakdown/:projectId
  // GET /api/cost/analysis/breakdown/:projectId — data.breakdown is array of { category, totalAmount, ... }
  async getCostBreakdown(projectId: string): Promise<CostBreakdown | null> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/cost/analysis/breakdown/${projectId}`);
      if (!response.data.success || !response.data.data) return null;
      const data = response.data.data;
      const breakdown = Array.isArray(data.breakdown) ? data.breakdown : [];
      const byCat = (name: string) =>
        Number(breakdown.find((b: any) => (b.category || '').toLowerCase() === name.toLowerCase())?.totalAmount ?? 0);
      return {
        ...data,
        actualMaterials: data.actualMaterials ?? byCat('Materials') ?? byCat('MATERIAL'),
        actualLabor: data.actualLabor ?? byCat('Labor') ?? byCat('LABOR'),
        actualEquipment: data.actualEquipment ?? byCat('Equipment') ?? byCat('EQUIPMENT'),
        totalAmount: Number(data.totalAmount ?? 0),
      } as CostBreakdown;
    } catch (error: any) {
      return null;
    }
  }

  // GET /api/cost/analysis/trend/:projectId
  async getCostTrend(projectId: string): Promise<CostTrend | null> {
    try {
      const response = await apiService.get<ApiResponse<CostTrend>>(`/cost/analysis/trend/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost trend');
    }
  }

  // GET /api/cost/analysis/forecast/:projectId
  async getCostForecast(projectId: string): Promise<CostForecast | null> {
    try {
      const response = await apiService.get<ApiResponse<CostForecast>>(`/cost/analysis/forecast/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost forecast');
    }
  }
}

export const costService = new CostService();
