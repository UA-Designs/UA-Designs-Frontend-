import { apiService } from './api';

// ---- Interfaces ----

export interface Stakeholder {
  id: string;
  name: string;
  organization?: string;
  role?: string;
  email?: string;
  phone?: string;
  influence?: string;  // e.g. High / Medium / Low
  interest?: string;   // e.g. High / Medium / Low
  type?: string;       // e.g. Internal / External
  projectId?: string;
  [key: string]: any;
}

export interface CreateStakeholderData {
  name: string;
  projectId: string;
  organization?: string;
  role?: string;
  email?: string;
  phone?: string;
  influence?: string;
  interest?: string;
  type?: string;
  [key: string]: any;
}

export interface Communication {
  id: string;
  stakeholderId: string;
  subject?: string;
  message?: string;
  type?: string;
  date?: string;
  [key: string]: any;
}

export interface CreateCommunicationData {
  subject?: string;
  message?: string;
  type?: string;
  date?: string;
  [key: string]: any;
}

export interface EngagementRecord {
  id: string;
  stakeholderId: string;
  engagementLevel?: string;
  notes?: string;
  date?: string;
  [key: string]: any;
}

export interface CreateEngagementData {
  engagementLevel?: string;
  notes?: string;
  date?: string;
  [key: string]: any;
}

export interface FeedbackData {
  feedback?: string;
  rating?: number;
  date?: string;
  [key: string]: any;
}

export interface MatrixQuadrant {
  influence: string;
  interest: string;
  strategy: string;
  stakeholders: Array<{
    id: string;
    name: string;
    role: string;
    organization: string;
    type: string;
    influence: string;
    interest: string;
    engagementLevel: string;
    status: string;
  }>;
  count: number;
}

export interface InfluenceMatrixData {
  projectId: string;
  matrix: Record<string, MatrixQuadrant>;
  totalStakeholders: number;
}

export interface StakeholderSummary {
  projectId?: string;
  total?: number;
  keyStakeholders?: number;
  engagementRate?: number;
  [key: string]: any;
}

// ---- API Response wrapper ----

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class StakeholderService {

  // ==================== STAKEHOLDERS ====================

  // GET /api/stakeholders
  async getStakeholders(projectId?: string): Promise<Stakeholder[]> {
    try {
      const response = await apiService.get<ApiResponse<Stakeholder[]>>('/stakeholders', {
        params: projectId ? { projectId } : undefined,
      });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stakeholders');
    }
  }

  // GET /api/stakeholders/:id
  async getStakeholderById(id: string): Promise<Stakeholder | null> {
    try {
      const response = await apiService.get<ApiResponse<Stakeholder>>(`/stakeholders/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stakeholder');
    }
  }

  // POST /api/stakeholders  (ADMIN | PROJECT_MANAGER)
  async createStakeholder(data: CreateStakeholderData): Promise<Stakeholder> {
    try {
      const response = await apiService.post<ApiResponse<Stakeholder>>('/stakeholders', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create stakeholder');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create stakeholder');
    }
  }

  // PUT /api/stakeholders/:id  (ADMIN | PROJECT_MANAGER)
  async updateStakeholder(id: string, data: Partial<CreateStakeholderData>): Promise<Stakeholder> {
    try {
      const response = await apiService.put<ApiResponse<Stakeholder>>(`/stakeholders/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update stakeholder');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update stakeholder');
    }
  }

  // DELETE /api/stakeholders/:id  (ADMIN | PROJECT_MANAGER)
  async deleteStakeholder(id: string): Promise<void> {
    try {
      await apiService.delete(`/stakeholders/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete stakeholder');
    }
  }

  // ==================== COMMUNICATIONS ====================

  // GET /api/stakeholders/:id/communications
  async getStakeholderCommunications(id: string): Promise<Communication[]> {
    try {
      const response = await apiService.get<ApiResponse<Communication[]>>(
        `/stakeholders/${id}/communications`
      );
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch communications');
    }
  }

  // POST /api/stakeholders/:id/communications
  async createCommunication(id: string, data: CreateCommunicationData): Promise<Communication> {
    try {
      const response = await apiService.post<ApiResponse<Communication>>(
        `/stakeholders/${id}/communications`,
        data
      );
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create communication');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create communication');
    }
  }

  // GET /api/stakeholders/communications/all
  async getAllCommunications(projectId?: string): Promise<Communication[]> {
    try {
      const response = await apiService.get<ApiResponse<Communication[]>>(
        '/stakeholders/communications/all',
        { params: projectId ? { projectId } : undefined }
      );
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all communications');
    }
  }

  // PUT /api/stakeholders/communications/:commId
  async updateCommunication(commId: string, data: Partial<CreateCommunicationData>): Promise<Communication> {
    try {
      const response = await apiService.put<ApiResponse<Communication>>(
        `/stakeholders/communications/${commId}`,
        data
      );
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update communication');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update communication');
    }
  }

  // DELETE /api/stakeholders/communications/:commId  (ADMIN | PROJECT_MANAGER)
  async deleteCommunication(commId: string): Promise<void> {
    try {
      await apiService.delete(`/stakeholders/communications/${commId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete communication');
    }
  }

  // ==================== ENGAGEMENT ====================

  // GET /api/stakeholders/:id/engagement
  async getEngagement(id: string): Promise<EngagementRecord[]> {
    try {
      const response = await apiService.get<ApiResponse<EngagementRecord[]>>(
        `/stakeholders/${id}/engagement`
      );
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch engagement');
    }
  }

  // POST /api/stakeholders/:id/engagement
  async createEngagement(id: string, data: CreateEngagementData): Promise<EngagementRecord> {
    try {
      const response = await apiService.post<ApiResponse<EngagementRecord>>(
        `/stakeholders/${id}/engagement`,
        data
      );
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create engagement record');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create engagement record');
    }
  }

  // POST /api/stakeholders/:id/feedback
  async recordFeedback(id: string, data: FeedbackData): Promise<any> {
    try {
      const response = await apiService.post<ApiResponse<any>>(
        `/stakeholders/${id}/feedback`,
        data
      );
      if (response.data.success) return response.data.data;
      throw new Error('Failed to record feedback');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to record feedback');
    }
  }

  // ==================== ANALYTICS ====================

  // GET /api/stakeholders/influence-matrix/:projectId
  async getInfluenceMatrix(projectId: string): Promise<InfluenceMatrixData | null> {
    try {
      const response = await apiService.get<ApiResponse<InfluenceMatrixData>>(
        `/stakeholders/influence-matrix/${projectId}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch influence matrix');
    }
  }

  // GET /api/stakeholders/summary/:projectId
  async getSummary(projectId: string): Promise<StakeholderSummary | null> {
    try {
      const response = await apiService.get<ApiResponse<StakeholderSummary>>(
        `/stakeholders/summary/${projectId}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch stakeholder summary');
    }
  }
}

export const stakeholderService = new StakeholderService();
