import { apiService } from './api';

// Enums matching backend
export enum RiskProbability {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

export enum RiskImpact {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5,
}

export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskStatus {
  IDENTIFIED = 'IDENTIFIED',
  ANALYZED = 'ANALYZED',
  MITIGATING = 'MITIGATING',
  MONITORING = 'MONITORING',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED',
}

export enum ResponseStrategy {
  AVOID = 'AVOID',
  MITIGATE = 'MITIGATE',
  TRANSFER = 'TRANSFER',
  ACCEPT = 'ACCEPT',
}

export enum MitigationStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EscalationLevel {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SENIOR_MANAGEMENT = 'SENIOR_MANAGEMENT',
  EXECUTIVE = 'EXECUTIVE',
}

// Interfaces
export interface RiskCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  category?: RiskCategory;
  projectId: string;
  probability: RiskProbability;
  impact: RiskImpact;
  riskScore: number;
  severity: RiskSeverity;
  status: RiskStatus;
  identifiedBy?: string;
  identifiedDate: string;
  residualProbability?: RiskProbability;
  residualImpact?: RiskImpact;
  residualScore?: number;
  responseStrategy?: ResponseStrategy;
  mitigationPlan?: string;
  contingencyPlan?: string;
  ownerId?: string;
  owner?: any;
  reviewDate?: string;
  escalationLevel?: EscalationLevel;
  escalationReason?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  mitigations?: Mitigation[];
}

export interface Mitigation {
  id: string;
  riskId: string;
  risk?: Risk;
  action: string;
  description?: string;
  status: MitigationStatus;
  strategy?: string;
  effectiveness?: string;
  assignedToId?: string;
  assignedTo?: any;
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  effectiveness?: number;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskMatrix {
  projectId: string;
  matrix: {
    probabilityLabel: string;
    impactLabel: string;
    count: number;
    riskIds: string[];
  }[][];
  totalRisks: number;
  probabilityBands: string[];
  impactBands: string[];
}

export interface RiskMonitoring {
  projectId: string;
  summary: {
    total: number;
    open: number;
    closed: number;
    openClosedRatio: string;
  };
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  topRisks: {
    id: string;
    title: string;
    riskScore: number;
    severity: string;
    status: string;
  }[];
  nearingDueMitigations: {
    riskId: string;
    riskTitle: string;
    mitigationId: string;
    dueDate: string;
  }[];
  recentlyEscalated: {
    id: string;
    title: string;
    escalatedDate: string;
  }[];
}

export interface RiskReport {
  projectId: string;
  project?: any;
  generatedAt: string;
  summary: {
    totalRisks: number;
    riskExposure: number;
    averageRiskScore: number;
    bySeverity: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
    };
    byStatus: {
      [key: string]: number;
    };
    byCategory: {
      categoryName: string;
      count: number;
    }[];
  };
  risks: Risk[];
  mitigations: {
    total: number;
    byStatus: {
      [key: string]: number;
    };
    totalEstimatedCost: number;
    totalActualCost: number;
    averageEffectiveness: number;
  };
  trends: {
    period: string;
    newRisks: number;
    mitigatedRisks: number;
    closedRisks: number;
    averageScore: number;
  }[];
}

export interface RiskFilters {
  categoryId?: string;
  severity?: RiskSeverity;
  status?: RiskStatus;
  minScore?: number;
  maxScore?: number;
  search?: string;
}

export interface MitigationFilters {
  riskId?: string;
  status?: MitigationStatus;
  assignedToId?: string;
}

// API Responses
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    risks?: T[];
    mitigations?: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      limit: number;
    };
  };
}

class RiskService {
  // Health check
  async checkHealth(): Promise<any> {
    try {
      const response = await apiService.get('/risk/health');
      return response.data;
    } catch (error: any) {
      return null;
    }
  }

  // Risks
  async getRisks(projectId: string, filters?: RiskFilters, page = 1, limit = 20): Promise<{ risks: Risk[]; pagination: any }> {
    try {
      const params: any = { projectId, page, limit };
      if (filters) {
        Object.assign(params, filters);
      }

      const response = await apiService.get<PaginatedResponse<Risk>>('/risk/risks', { params });
      if (response.data.success) {
        const data = response.data.data as any;
        const risks: Risk[] = Array.isArray(data) ? data : (data.risks || data.data || []);
        const pagination = Array.isArray(data)
          ? (response.data as any).pagination
          : (data.pagination || (response.data as any).pagination);
        return { risks, pagination };
      }
      return { risks: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit } };
    } catch (error: any) {
      return { risks: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit } };
    }
  }

  async getRiskById(riskId: string): Promise<Risk | null> {
    try {
      const response = await apiService.get<ApiResponse<Risk>>(`/risk/risks/${riskId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      return null;
    }
  }

  async createRisk(riskData: Partial<Risk>): Promise<Risk> {
    try {
      const response = await apiService.post<ApiResponse<Risk>>('/risk/risks', riskData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create risk');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create risk');
    }
  }

  async updateRisk(riskId: string, riskData: Partial<Risk>): Promise<Risk> {
    try {
      const response = await apiService.put<ApiResponse<Risk>>(`/risk/risks/${riskId}`, riskData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update risk');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update risk');
    }
  }

  async assessRisk(riskId: string, residualProbability: RiskProbability, residualImpact: RiskImpact): Promise<Risk> {
    try {
      const response = await apiService.post<ApiResponse<Risk>>(`/risk/risks/${riskId}/assess`, {
        residualProbability,
        residualImpact,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to assess risk');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assess risk');
    }
  }

  async escalateRisk(riskId: string, level: EscalationLevel, reason: string): Promise<Risk> {
    try {
      const response = await apiService.post<ApiResponse<Risk>>(`/risk/risks/${riskId}/escalate`, {
        level,
        reason,
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to escalate risk');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to escalate risk');
    }
  }

  // PATCH /api/risk/risks/:id/status
  async updateRiskStatus(riskId: string, status: RiskStatus): Promise<Risk> {
    try {
      const response = await apiService.patch<ApiResponse<Risk>>(`/risk/risks/${riskId}/status`, { status });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update risk status');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update risk status');
    }
  }

  async deleteRisk(riskId: string): Promise<void> {
    try {
      await apiService.delete(`/risk/risks/${riskId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete risk');
    }
  }

  // Risk Matrix
  async getRiskMatrix(projectId: string): Promise<RiskMatrix | null> {
    try {
      const response = await apiService.get<ApiResponse<RiskMatrix>>(`/risk/matrix/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      return null;
    }
  }

  // Risk Monitoring
  async getRiskMonitoring(projectId: string): Promise<RiskMonitoring | null> {
    try {
      const response = await apiService.get<ApiResponse<RiskMonitoring>>(`/risk/monitoring/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      return null;
    }
  }

  // Risk Report
  async getRiskReport(projectId: string): Promise<RiskReport | null> {
    try {
      const response = await apiService.get<ApiResponse<RiskReport>>(`/risk/report/${projectId}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      return null;
    }
  }

  // Mitigations
  async getMitigations(projectId: string, filters?: MitigationFilters, page = 1, limit = 20): Promise<{ mitigations: Mitigation[]; pagination: any }> {
    try {
      const params: any = { projectId, page, limit };
      if (filters) {
        Object.assign(params, filters);
      }

      const response = await apiService.get<PaginatedResponse<Mitigation>>('/risk/mitigations', { params });
      if (response.data.success) {
        const data = response.data.data as any;
        const mitigations: Mitigation[] = Array.isArray(data) ? data : (data.mitigations || data.data || []);
        const pagination = Array.isArray(data)
          ? (response.data as any).pagination
          : (data.pagination || (response.data as any).pagination);
        return { mitigations, pagination };
      }
      return { mitigations: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit } };
    } catch (error: any) {
      return { mitigations: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit } };
    }
  }

  async createMitigation(mitigationData: Partial<Mitigation>): Promise<Mitigation> {
    try {
      const response = await apiService.post<ApiResponse<Mitigation>>('/risk/mitigations', mitigationData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create mitigation');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create mitigation');
    }
  }

  async updateMitigation(mitigationId: string, mitigationData: Partial<Mitigation>): Promise<Mitigation> {
    try {
      const response = await apiService.put<ApiResponse<Mitigation>>(`/risk/mitigations/${mitigationId}`, mitigationData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update mitigation');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update mitigation');
    }
  }

  async deleteMitigation(mitigationId: string): Promise<void> {
    try {
      await apiService.delete(`/risk/mitigations/${mitigationId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete mitigation');
    }
  }
}

export const riskService = new RiskService();
