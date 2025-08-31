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
}

export enum UserRole {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  TEAM_LEAD = 'team_lead',
  CONTRACTOR = 'contractor',
  CLIENT = 'client',
  VIEWER = 'viewer',
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

// Quality Types
export interface QualityCheck {
  id: string;
  title: string;
  description: string;
  type: QualityCheckType;
  status: QualityCheckStatus;
  projectId: string;
  project?: Project;
  taskId?: string;
  task?: Task;
  assignedToId: string;
  assignedTo?: User;
  scheduledDate: string;
  completedDate?: string;
  result: QualityCheckResult;
  notes?: string;
  attachments: QualityAttachment[];
  createdAt: string;
  updatedAt: string;
}

export enum QualityCheckType {
  INSPECTION = 'inspection',
  AUDIT = 'audit',
  TEST = 'test',
  REVIEW = 'review',
  APPROVAL = 'approval',
}

export enum QualityCheckStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum QualityCheckResult {
  PASS = 'pass',
  FAIL = 'fail',
  CONDITIONAL = 'conditional',
  PENDING = 'pending',
}

export interface QualityAttachment {
  id: string;
  qualityCheckId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

// Communication Types
export interface Communication {
  id: string;
  title: string;
  content: string;
  type: CommunicationType;
  priority: CommunicationPriority;
  projectId: string;
  project?: Project;
  senderId: string;
  sender?: User;
  recipients: CommunicationRecipient[];
  attachments: CommunicationAttachment[];
  scheduledAt?: string;
  sentAt?: string;
  status: CommunicationStatus;
  createdAt: string;
  updatedAt: string;
}

export enum CommunicationType {
  EMAIL = 'email',
  MEETING = 'meeting',
  REPORT = 'report',
  NOTIFICATION = 'notification',
  DOCUMENT = 'document',
}

export enum CommunicationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum CommunicationStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export interface CommunicationRecipient {
  id: string;
  communicationId: string;
  userId: string;
  user: User;
  status: RecipientStatus;
  readAt?: string;
}

export enum RecipientStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export interface CommunicationAttachment {
  id: string;
  communicationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
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
  type: CommunicationType;
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

// Procurement Types
export interface Procurement {
  id: string;
  title: string;
  description: string;
  type: ProcurementType;
  status: ProcurementStatus;
  projectId: string;
  project?: Project;
  vendorId?: string;
  vendor?: Vendor;
  requestedBy: string;
  requestedByUser?: User;
  approvedBy?: string;
  approvedByUser?: User;
  requestedDate: string;
  approvedDate?: string;
  deliveryDate?: string;
  totalAmount: number;
  items: ProcurementItem[];
  documents: ProcurementDocument[];
  createdAt: string;
  updatedAt: string;
}

export enum ProcurementType {
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  CONSULTING = 'consulting',
  SOFTWARE = 'software',
}

export enum ProcurementStatus {
  DRAFT = 'draft',
  REQUESTED = 'requested',
  APPROVED = 'approved',
  ORDERED = 'ordered',
  DELIVERED = 'delivered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface ProcurementItem {
  id: string;
  procurementId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface ProcurementDocument {
  id: string;
  procurementId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
