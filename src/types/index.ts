// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string | null;
  phone?: string;
  department?: string;
  employeeId?: string;
  hireDate?: string;
  lastLogin?: string;
  permissions?: Record<string, string[]>;
  approvalLevel?: string;
  isActive: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  CIVIL_ENGINEER = 'CIVIL_ENGINEER',
  ARCHITECT = 'ARCHITECT',
  SITE_ENGINEER = 'SITE_ENGINEER',
  JUNIOR_ARCHITECT = 'JUNIOR_ARCHITECT',
  APPRENTICE_ARCHITECT = 'APPRENTICE_ARCHITECT',
  BOOKKEEPER = 'BOOKKEEPER',
  SECRETARY = 'SECRETARY',
  TEAM_LEAD = 'TEAM_LEAD',
  CONTRACTOR = 'CONTRACTOR',
  CLIENT = 'CLIENT',
  VIEWER = 'VIEWER',
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole | string;
  department?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  roleBreakdown: Record<string, number>;
  recentUsers?: User[];
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
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost: number;
  progress: number;
  projectManagerId: string;
  projectManager?: User;
  clientId: string;
  client?: User;
  teamMembers: ProjectTeamMember[];
  createdAt: string;
  updatedAt: string;
}

export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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

// File Upload Types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
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

// Integration Management Types
export interface ProjectCharter {
  id: string;
  charterNumber: string;
  projectTitle: string;
  projectType: ProjectType;
  projectDescription: string;
  businessJustification: string;
  objectives: string[];
  successCriteria: string[];
  scope: {
    included: string[];
    excluded: string[];
    assumptions: string[];
    constraints: string[];
  };
  deliverables: string[];
  milestones: ProjectMilestone[];
  budget: {
    estimated: number;
    approved: number;
    currency: string;
  };
  timeline: {
    startDate: string;
    endDate: string;
    phases: ProjectPhase[];
  };
  team: {
    sponsor: string;
    projectManager: string;
    teamMembers: ProjectTeamMember[];
    stakeholders: Stakeholder[];
  };
  risks: Risk[];
  approvalStatus: ApprovalStatus;
  approvalWorkflow: ApprovalWorkflow[];
  template: CharterTemplate;
  attachments: CharterAttachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  INFRASTRUCTURE = 'infrastructure',
  RENOVATION = 'renovation',
  MAINTENANCE = 'maintenance',
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  dependencies: string[];
  deliverables: string[];
  status: MilestoneStatus;
  completedAt?: string;
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  deliverables: string[];
  team: string[];
  status: PhaseStatus;
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
}

export interface CharterTemplate {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  sections: TemplateSection[];
  isDefault: boolean;
  createdAt: string;
  createdBy: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  fields: TemplateField[];
  isRequired: boolean;
  order: number;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'file';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: any;
  order: number;
}

export interface CharterAttachment {
  id: string;
  charterId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  changeType: ChangeType;
  priority: ChangePriority;
  impactLevel: ImpactLevel;
  businessJustification: string;
  projectId: string;
  project?: Project;
  requestedBy: string;
  requestedByUser?: User;
  requestedAt: string;
  status: ChangeRequestStatus;
  approvalWorkflow: ChangeApprovalWorkflow[];
  impactAnalysis?: ChangeImpactAnalysis;
  implementationPlan?: ImplementationPlan;
  attachments: ChangeRequestAttachment[];
  comments: ChangeRequestComment[];
  createdAt: string;
  updatedAt: string;
}

export enum ChangeType {
  SCOPE = 'scope',
  SCHEDULE = 'schedule',
  COST = 'cost',
  QUALITY = 'quality',
  RESOURCE = 'resource',
  TECHNICAL = 'technical',
  REGULATORY = 'regulatory',
  ENVIRONMENTAL = 'environmental',
}

export enum ChangePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ChangeRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
  CANCELLED = 'cancelled',
}

export interface ChangeApprovalWorkflow {
  id: string;
  changeRequestId: string;
  approver: string;
  approverUser?: User;
  role: ApprovalRole;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: string;
  dueDate: string;
  order: number;
}

export enum ApprovalRole {
  CLIENT = 'client',
  ARCHITECT = 'architect',
  ENGINEER = 'engineer',
  CONTRACTOR = 'contractor',
  PROJECT_MANAGER = 'project_manager',
  SPONSOR = 'sponsor',
  STAKEHOLDER = 'stakeholder',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELEGATED = 'delegated',
}

export interface ApprovalWorkflow {
  id: string;
  entityType: 'charter' | 'change_request' | 'workflow';
  entityId: string;
  approver: string;
  approverUser?: User;
  role: ApprovalRole;
  status: ApprovalStatus;
  comments?: string;
  approvedAt?: string;
  dueDate: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeImpactAnalysis {
  id: string;
  changeRequestId: string;
  costImpact: {
    additionalCost: number;
    costVariance: number;
    budgetImplications: string[];
    mitigationOptions: string[];
  };
  scheduleImpact: {
    delayDays: number;
    criticalPathAffected: boolean;
    dependencies: string[];
    mitigationOptions: string[];
  };
  scopeImpact: {
    scopeChange: string;
    deliverablesAffected: string[];
    qualityImplications: string[];
    mitigationOptions: string[];
  };
  resourceImpact: {
    additionalResources: string[];
    skillGaps: string[];
    capacityImplications: string[];
    mitigationOptions: string[];
  };
  qualityImpact: {
    qualityRisks: string[];
    testingImplications: string[];
    complianceIssues: string[];
    mitigationOptions: string[];
  };
  riskImpact: {
    newRisks: string[];
    riskMitigation: string[];
    contingencyPlans: string[];
  };
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  analyzedBy: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImplementationPlan {
  id: string;
  changeRequestId: string;
  phases: ImplementationPhase[];
  resources: ImplementationResource[];
  timeline: {
    startDate: string;
    endDate: string;
    milestones: ImplementationMilestone[];
  };
  risks: ImplementationRisk[];
  successCriteria: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImplementationPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  deliverables: string[];
  team: string[];
  status: PhaseStatus;
}

export interface ImplementationResource {
  id: string;
  type: 'human' | 'material' | 'equipment' | 'financial';
  name: string;
  quantity: number;
  cost: number;
  availability: string;
  assignedTo?: string;
}

export interface ImplementationMilestone {
  id: string;
  name: string;
  targetDate: string;
  dependencies: string[];
  deliverables: string[];
  status: MilestoneStatus;
  completedAt?: string;
}

export interface ImplementationRisk {
  id: string;
  description: string;
  probability: RiskProbability;
  impact: RiskImpact;
  mitigation: string;
  owner: string;
}

export interface ChangeRequestAttachment {
  id: string;
  changeRequestId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ChangeRequestComment {
  id: string;
  changeRequestId: string;
  content: string;
  author: string;
  authorUser?: User;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationDashboard {
  id: string;
  summary: {
    totalProjects: number;
    activeProjects: number;
    projectsAtRisk: number;
    pendingApprovals: number;
    criticalIssues: number;
    changeRequests: number;
    approvedCharters: number;
  };
  recentActivity: {
    id: string;
    type: 'CHANGE_REQUEST' | 'WORKFLOW_APPROVAL' | 'MILESTONE_ACHIEVED' | 'RISK_IDENTIFIED' | 'CHARTER_APPROVED';
    description: string;
    projectId: string;
    projectName: string;
    timestamp: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  projectHealth: {
    projectId: string;
    projectName: string;
    overallHealth: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    scheduleHealth: number;
    costHealth: number;
    qualityHealth: number;
    resourceHealth: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  pendingActions: {
    id: string;
    type: 'APPROVAL' | 'REVIEW' | 'MITIGATION' | 'ESCALATION';
    description: string;
    projectId: string;
    projectName: string;
    assignee: string;
    dueDate: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  dependencies: {
    id: string;
    fromProject: string;
    toProject: string;
    type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
    status: 'ACTIVE' | 'COMPLETED' | 'BLOCKED';
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }[];
  createdAt: string;
  updatedAt: string;
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}
