import { apiService } from './api';

// Cost Types
export interface Cost {
  id: string;
  projectId: string;
  taskId?: string;
  budgetId?: string;
  categoryId?: string;
  name: string;
  description?: string;
  estimatedCost: number;
  actualCost: number;
  variance?: number;
  type: 'labor' | 'material' | 'equipment' | 'subcontractor' | 'overhead' | 'other';
  status: 'estimated' | 'approved' | 'committed' | 'spent';
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  totalAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  contingency: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'closed';
  startDate: string;
  endDate: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  projectId: string;
  budgetId?: string;
  categoryId?: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  invoiceNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submittedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EVMMetrics {
  projectId: string;
  plannedValue: number;        // PV - Budgeted Cost of Work Scheduled (BCWS)
  earnedValue: number;         // EV - Budgeted Cost of Work Performed (BCWP)
  actualCost: number;          // AC - Actual Cost of Work Performed (ACWP)
  costVariance: number;        // CV = EV - AC
  scheduleVariance: number;    // SV = EV - PV
  costPerformanceIndex: number; // CPI = EV / AC
  schedulePerformanceIndex: number; // SPI = EV / PV
  estimateAtCompletion: number; // EAC
  estimateToComplete: number;   // ETC
  varianceAtCompletion: number; // VAC
  toCompletePerformanceIndex: number; // TCPI
  budgetAtCompletion: number;  // BAC
}

export interface CostOverview {
  projectId: string;
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  totalRemaining: number;
  budgetUtilization: number;
  burnRate: number;
  projectedOverrun: number;
  costByCategory: { category: string; amount: number; percentage: number }[];
  costByType: { type: string; amount: number; percentage: number }[];
}

export interface CostTrend {
  period: string;
  plannedCost: number;
  actualCost: number;
  cumulativePlanned: number;
  cumulativeActual: number;
}

export interface CostForecast {
  projectId: string;
  currentSpent: number;
  projectedTotal: number;
  budgetAtCompletion: number;
  estimateAtCompletion: number;
  varianceAtCompletion: number;
  completionDate: string;
  confidenceLevel: number;
  scenarios: {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
  };
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    items: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

class CostService {
  // ==================== COST ENDPOINTS ====================
  
  async getCosts(projectId?: string, filters?: { type?: string; status?: string }): Promise<Cost[]> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await apiService.get<ApiResponse<Cost[]>>(`/cost/costs?${params.toString()}`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('CostService - Error fetching costs:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch costs');
    }
  }

  async getCostById(id: string): Promise<Cost> {
    try {
      const response = await apiService.get<ApiResponse<Cost>>(`/cost/costs/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Cost not found');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost');
    }
  }

  async getCostSummary(projectId: string): Promise<{ type: string; total: number; count: number }[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/cost/costs/summary?projectId=${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost summary');
    }
  }

  async createCost(costData: Partial<Cost>): Promise<Cost> {
    try {
      const response = await apiService.post<ApiResponse<Cost>>('/cost/costs', costData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create cost');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create cost');
    }
  }

  async updateCost(id: string, costData: Partial<Cost>): Promise<Cost> {
    try {
      const response = await apiService.put<ApiResponse<Cost>>(`/cost/costs/${id}`, costData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update cost');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update cost');
    }
  }

  async deleteCost(id: string): Promise<void> {
    try {
      await apiService.delete(`/cost/costs/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete cost');
    }
  }

  async updateCostStatus(id: string, status: Cost['status']): Promise<Cost> {
    try {
      const response = await apiService.patch<ApiResponse<Cost>>(`/cost/costs/${id}/status`, { status });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update cost status');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update cost status');
    }
  }

  // ==================== BUDGET ENDPOINTS ====================

  async getBudgets(projectId?: string): Promise<Budget[]> {
    try {
      const params = projectId ? `?projectId=${projectId}` : '';
      const response = await apiService.get<ApiResponse<Budget[]>>(`/cost/budgets${params}`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('CostService - Error fetching budgets:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }

  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await apiService.get<ApiResponse<Budget>>(`/cost/budgets/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Budget not found');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
  }

  async getBudgetUtilization(id: string): Promise<any> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/cost/budgets/${id}/utilization`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch budget utilization');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget utilization');
    }
  }

  async createBudget(budgetData: Partial<Budget>): Promise<Budget> {
    try {
      const response = await apiService.post<ApiResponse<Budget>>('/cost/budgets', budgetData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
  }

  async updateBudget(id: string, budgetData: Partial<Budget>): Promise<Budget> {
    try {
      const response = await apiService.put<ApiResponse<Budget>>(`/cost/budgets/${id}`, budgetData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
  }

  async deleteBudget(id: string): Promise<void> {
    try {
      await apiService.delete(`/cost/budgets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
  }

  async approveBudget(id: string): Promise<Budget> {
    try {
      const response = await apiService.patch<ApiResponse<Budget>>(`/cost/budgets/${id}/approve`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to approve budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve budget');
    }
  }

  async reviseBudget(id: string, revisionData: { amount: number; reason: string }): Promise<Budget> {
    try {
      const response = await apiService.post<ApiResponse<Budget>>(`/cost/budgets/${id}/revise`, revisionData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to revise budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to revise budget');
    }
  }

  async closeBudget(id: string): Promise<Budget> {
    try {
      const response = await apiService.patch<ApiResponse<Budget>>(`/cost/budgets/${id}/close`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to close budget');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to close budget');
    }
  }

  // ==================== EXPENSE ENDPOINTS ====================

  async getExpenses(projectId?: string, filters?: { status?: string; budgetId?: string }): Promise<Expense[]> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.budgetId) params.append('budgetId', filters.budgetId);
      
      const response = await apiService.get<ApiResponse<Expense[]>>(`/cost/expenses?${params.toString()}`);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('CostService - Error fetching expenses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }

  async getExpenseById(id: string): Promise<Expense> {
    try {
      const response = await apiService.get<ApiResponse<Expense>>(`/cost/expenses/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Expense not found');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expense');
    }
  }

  async getExpenseSummary(projectId: string): Promise<any> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/cost/expenses/summary/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expense summary');
    }
  }

  async createExpense(expenseData: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiService.post<ApiResponse<Expense>>('/cost/expenses', expenseData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create expense');
    }
  }

  async updateExpense(id: string, expenseData: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiService.put<ApiResponse<Expense>>(`/cost/expenses/${id}`, expenseData);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update expense');
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await apiService.delete(`/cost/expenses/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete expense');
    }
  }

  async approveExpense(id: string): Promise<Expense> {
    try {
      const response = await apiService.patch<ApiResponse<Expense>>(`/cost/expenses/${id}/approve`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to approve expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to approve expense');
    }
  }

  async rejectExpense(id: string, reason: string): Promise<Expense> {
    try {
      const response = await apiService.patch<ApiResponse<Expense>>(`/cost/expenses/${id}/reject`, { reason });
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to reject expense');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reject expense');
    }
  }

  async markExpensePaid(id: string): Promise<Expense> {
    try {
      const response = await apiService.patch<ApiResponse<Expense>>(`/cost/expenses/${id}/pay`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to mark expense as paid');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark expense as paid');
    }
  }

  async bulkApproveExpenses(expenseIds: string[]): Promise<void> {
    try {
      await apiService.post('/cost/expenses/bulk-approve', { expenseIds });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk approve expenses');
    }
  }

  // ==================== ANALYSIS ENDPOINTS ====================

  async getCostOverview(projectId: string): Promise<CostOverview> {
    try {
      const response = await apiService.get<ApiResponse<CostOverview>>(`/cost/analysis/overview/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch cost overview');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost overview');
    }
  }

  async getEVMMetrics(projectId: string): Promise<EVMMetrics> {
    try {
      const response = await apiService.get<ApiResponse<EVMMetrics>>(`/cost/analysis/evm/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch EVM metrics');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch EVM metrics');
    }
  }

  async getCostBreakdown(projectId: string): Promise<{ category: string; amount: number; percentage: number }[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>(`/cost/analysis/breakdown/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost breakdown');
    }
  }

  async getCostTrend(projectId: string, period?: 'daily' | 'weekly' | 'monthly'): Promise<CostTrend[]> {
    try {
      const params = period ? `?period=${period}` : '';
      const response = await apiService.get<ApiResponse<CostTrend[]>>(`/cost/analysis/trend/${projectId}${params}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost trend');
    }
  }

  async getCostForecast(projectId: string): Promise<CostForecast> {
    try {
      const response = await apiService.get<ApiResponse<CostForecast>>(`/cost/analysis/forecast/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch cost forecast');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost forecast');
    }
  }

  async compareProjectCosts(projectIds: string[]): Promise<any> {
    try {
      const params = projectIds.map(id => `projectIds=${id}`).join('&');
      const response = await apiService.get<ApiResponse<any>>(`/cost/analysis/compare?${params}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to compare project costs');
    }
  }
}

export const costService = new CostService();
