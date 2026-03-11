// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional profile fields (accepted by PUT /api/users/:id)
  phone?: string;
  department?: string;
  employeeId?: string;
  costCenter?: string;
  officeLocation?: string;
  hireDate?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROPRIETOR = 'PROPRIETOR',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  ARCHITECT = 'ARCHITECT',
  ENGINEER = 'ENGINEER',
  STAFF = 'STAFF',
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  projectNumber?: string;
  description: string;
  status: ProjectStatus;
  phase?: ProjectPhase;
  priority: ProjectPriority;
  projectType?: ProjectType;
  startDate?: string;
  endDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  budget: number;
  actualCost?: number;
  progress: number;
  projectManagerId?: string;
  projectManager?: User;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  location?: string;
  isActive?: boolean;
  teamMembers?: ProjectTeamMember[];
  createdAt: string;
  updatedAt: string;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProjectPhase {
  INITIATION = 'initiation',
  PLANNING = 'planning',
  DESIGN = 'design',
  CONSTRUCTION = 'construction',
  EXECUTION = 'execution',
  MONITORING = 'monitoring',
  CLOSING = 'closing',
}

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  INFRASTRUCTURE = 'infrastructure',
  RENOVATION = 'renovation',
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ProjectTeamMember {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  role: string;
  hourlyRate?: number;
  assignedAt: string;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  projectId: string;
  project?: Project;
  assignedToId: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
  dependencies: TaskDependency[];
  subtasks: Task[];
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
}

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish',
}

// Resource Types
export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category: string;
  description: string;
  unit: string;
  costPerUnit: number;
  availability: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ResourceType {
  MATERIAL = 'material',
  EQUIPMENT = 'equipment',
  LABOR = 'labor',
  SUBCONTRACTOR = 'subcontractor',
}

export interface ResourceAllocation {
  id: string;
  projectId: string;
  resourceId: string;
  resource: Resource;
  quantity: number;
  startDate: string;
  endDate: string;
  cost: number;
  status: AllocationStatus;
  createdAt: string;
  updatedAt: string;
}

export enum AllocationStatus {
  PLANNED = 'planned',
  ALLOCATED = 'allocated',
  IN_USE = 'in_use',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Risk Types
export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: RiskProbability;
  impact: RiskImpact;
  priority: RiskPriority;
  status: RiskStatus;
  mitigationStrategy: string;
  contingencyPlan: string;
  ownerId: string;
  owner?: User;
  projectId: string;
  project?: Project;
  identifiedDate: string;
  targetDate: string;
  actualDate?: string;
  createdAt: string;
  updatedAt: string;
}

export enum RiskCategory {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  SCHEDULE = 'schedule',
  RESOURCE = 'resource',
  ENVIRONMENTAL = 'environmental',
  REGULATORY = 'regulatory',
  SAFETY = 'safety',
}

export enum RiskProbability {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum RiskImpact {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum RiskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskStatus {
  IDENTIFIED = 'identified',
  ANALYZED = 'analyzed',
  PLANNED = 'planned',
  MONITORED = 'monitored',
  MITIGATED = 'mitigated',
  CLOSED = 'closed',
}



// Stakeholder Types
export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization: string;
  position: string;
  type: StakeholderType;
  influence: StakeholderInfluence;
  interest: StakeholderInterest;
  projectId: string;
  project?: Project;
  communicationPreferences: CommunicationPreference[];
  createdAt: string;
  updatedAt: string;
}

export enum StakeholderType {
  CLIENT = 'client',
  SPONSOR = 'sponsor',
  TEAM_MEMBER = 'team_member',
  CONTRACTOR = 'contractor',
  SUPPLIER = 'supplier',
  REGULATOR = 'regulator',
  COMMUNITY = 'community',
}

export enum StakeholderInfluence {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum StakeholderInterest {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export interface CommunicationPreference {
  id: string;
  stakeholderId: string;
  type: 'email' | 'meeting' | 'report' | 'notification' | 'document';
  frequency: CommunicationFrequency;
  isEnabled: boolean;
}

export enum CommunicationFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  AS_NEEDED = 'as_needed',
}


// Dashboard and Analytics Types
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalBudget: number;
  actualCost: number;
  costVariance: number;
  scheduleVariance: number;
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  progress: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
}

export interface TaskProgress {
  taskId: string;
  taskTitle: string;
  progress: number;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string;
}

export interface CostVariance {
  projectId: string;
  projectName: string;
  plannedCost: number;
  actualCost: number;
  variance: number;
  variancePercentage: number;
}

export interface RiskMatrix {
  highImpact: Risk[];
  mediumImpact: Risk[];
  lowImpact: Risk[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'date'
    | 'select'
    | 'textarea'
    | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: any;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  PROJECT_UPDATE = 'project_update',
  TASK_ASSIGNED = 'task_assigned',
  DEADLINE_APPROACHING = 'deadline_approaching',
  RISK_ALERT = 'risk_alert',
}


// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

// Gantt Chart Types
export interface GanttTask {
  id: string;
  title: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string[];
  type?: 'task' | 'milestone';
  color?: string;
}

// Recent Activity Types
export interface RecentActivity {
  id: string;
  type: ActivityType;
  description: string;
  user: User;
  project?: Project;
  task?: Task;
  createdAt: string;
}

export enum ActivityType {
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  TASK_CREATED = 'task_created',
  TASK_COMPLETED = 'task_completed',
  USER_JOINED = 'user_joined',
  DOCUMENT_UPLOADED = 'document_uploaded',
  COMMENT_ADDED = 'comment_added',
}

// ── Audit Log Types ──────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'APPROVE'
  | 'REJECT'
  | 'ESCALATE';

export type AuditEntity =
  | 'PROJECT'
  | 'TASK'
  | 'BUDGET'
  | 'EXPENSE'
  | 'COST'
  | 'RISK'
  | 'MITIGATION'
  | 'STAKEHOLDER'
  | 'COMMUNICATION'
  | 'USER'
  | 'MATERIAL'
  | 'LABOR'
  | 'EQUIPMENT'
  | 'TEAM_MEMBER'
  | 'ALLOCATION'
  | 'DEPENDENCY';

export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  description: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  statusCode: number;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'ASC' | 'DESC';
}


