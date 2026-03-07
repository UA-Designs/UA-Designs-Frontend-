// ── Overview ─────────────────────────────────────────────

export interface AnalyticsKPIs {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  openRisks: number;
  activeTeamMembers: number;
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskDistribution = Record<TaskStatus, number>;

export type ExpenseCategory =
  | 'MATERIAL'
  | 'LABOR'
  | 'EQUIPMENT'
  | 'OVERHEAD'
  | 'SUBCONTRACTOR'
  | 'PERMITS'
  | 'OTHER';
export type ExpensesByCategory = Record<ExpenseCategory, number>;

export interface MonthlySpendingPoint {
  month: string; // "YYYY-MM"
  amount: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  description: string;
  timestamp: string;
  userName: string;
}

export interface AnalyticsOverview {
  kpis: AnalyticsKPIs;
  taskDistribution: TaskDistribution;
  expensesByCategory: ExpensesByCategory;
  monthlySpending: MonthlySpendingPoint[];
  recentActivity: ActivityItem[];
}

export interface OverviewResponse {
  success: true;
  data: AnalyticsOverview;
  generatedAt: string;
}

// ── Project Analytics ────────────────────────────────────

export interface ProjectInfo {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface ProjectBudget {
  totalBudget: number;
  totalSpent: number;
  totalPending: number;
  remaining: number;
  utilization: number;
  isOverBudget: boolean;
}

export interface ProjectTaskSummary {
  total: number;
  distribution: TaskDistribution;
  overdue: number;
  completionRate: number;
}

export interface ProjectAnalytics {
  project: ProjectInfo;
  budget: ProjectBudget;
  taskSummary: ProjectTaskSummary;
  expensesByCategory: ExpensesByCategory;
  monthlySpending: MonthlySpendingPoint[];
  recentActivity: ActivityItem[];
}

export interface ProjectAnalyticsResponse {
  success: true;
  data: ProjectAnalytics;
  generatedAt: string;
}
