import { apiService } from './api';
import { Project, ProjectStatus, ProjectPhase, ProjectType } from '../types';

export interface ProjectFilters {
  page?: number;
  limit?: number;
  status?: string;
  projectType?: string;
  phase?: string;
  projectManagerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProjectsPagedResponse {
  projects: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProjectDashboardData {
  project: Project;
  taskCount: number;
  completedTasks: number;
  budgetCount: number;
  riskCount: number;
  stakeholderCount: number;
  recentTasks?: any[];
  recentRisks?: any[];
  [key: string]: any;
}

export interface ProjectResponse {
  success: boolean;
  message?: string;
  data: { project?: Project } | Project;
}

export interface ProjectBudgetOverviewResponse {
  success: boolean;
  message?: string;
  data: {
    projectId: string;
    projectName: string;
    budget: number;
    totalActualCost: number;
    variance: number;
    isOverBudget: boolean;
    expenseCount: number;
  };
}

export interface ProjectsResponse {
  success: boolean;
  message?: string;
  data: Project[];
}

export interface ProjectStatsResponse {
  success: boolean;
  message?: string;
  data: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;
    cancelledProjects: number;
    projectsByPhase: Record<string, number>;
    projectsByStatus: Record<string, number>;
    totalBudget: number;
    spentBudget: number;
    remainingBudget: number;
  };
}

class ProjectService {
  async getProjects(): Promise<Project[]> {
    try {
      const response = await apiService.get<any>('/projects');
      const d = response.data;

      // Paginated format: { success, data: { projects: [...], pagination: {...} } }
      if (d.success && d.data?.projects && Array.isArray(d.data.projects)) {
        return d.data.projects;
      }
      // Flat array format: { success, data: Project[] }
      if (d.success && Array.isArray(d.data)) {
        return d.data;
      }
      // Raw array
      if (Array.isArray(d)) {
        return d;
      }
      return [];
    } catch (error: any) {
      if (error.response?.data?.message === 'Access token required') {
        return [];
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch projects');
    }
  }

  async getProjectById(id: string): Promise<Project> {
    try {
      const response = await apiService.get<ProjectResponse>(`/projects/${id}`);
      const data = response.data?.data;
      if (!response.data?.success || !data) throw new Error('Project not found');
      // API returns { success, data: { project } } — project is under data.project
      const raw = (data as any).project ?? data;
      const p = raw as any;
      const budgetVal = raw.budget ?? p.budget_amount ?? p.budget;
      const budgetNum = budgetVal != null ? parseFloat(String(budgetVal)) : 0;
      return {
        ...raw,
        id: raw.id ?? p._id,
        location: raw.location ?? p.location ?? p.address ?? '',
        startDate: raw.startDate ?? p.start_date ?? null,
        endDate: raw.endDate ?? p.end_date ?? null,
        plannedEndDate: raw.plannedEndDate ?? p.planned_end_date ?? raw.endDate ?? null,
        actualEndDate: raw.actualEndDate ?? p.actual_end_date ?? null,
        clientName: raw.clientName ?? p.client_name ?? null,
        budget: Number.isFinite(budgetNum) ? budgetNum : 0,
        actualCost: undefined, // use getProjectBudgetOverview for spent
      } as Project;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project');
    }
  }

  /** GET /api/projects/:id/budget-overview — project-level budget vs actual (total spent) */
  async getProjectBudgetOverview(projectId: string): Promise<ProjectBudgetOverviewResponse['data'] | null> {
    try {
      const response = await apiService.get<ProjectBudgetOverviewResponse>(`/projects/${projectId}/budget-overview`);
      return response.data?.success && response.data?.data ? response.data.data : null;
    } catch (error: any) {
      return null;
    }
  }

  async createProject(projectData: any): Promise<Project> {
    try {
      const response = await apiService.post<any>('/projects', projectData);
      
      // Handle both wrapped and direct response formats
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data.id) {
        // Direct response format
        return response.data;
      }
      
      throw new Error('Failed to create project');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to create project');
    }
  }

  async updateProject(id: string, projectData: any): Promise<Project> {
    try {
      const response = await apiService.put<ProjectResponse>(`/projects/${id}`, projectData);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to update project');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update project');
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await apiService.delete(`/projects/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete project');
    }
  }

  async getProjectStats(): Promise<ProjectStatsResponse['data']> {
    try {
      const response = await apiService.get<ProjectStatsResponse>('/projects/stats/overview');
      return response.data.success ? response.data.data : {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        cancelledProjects: 0,
        projectsByPhase: {},
        projectsByStatus: {},
        totalBudget: 0,
        spentBudget: 0,
        remainingBudget: 0
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project statistics');
    }
  }

  async getProjectsFiltered(filters: ProjectFilters = {}): Promise<ProjectsPagedResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await apiService.get<any>(`/projects${query}`);
      const d = response.data;
      // API may return { success, data: { projects, pagination } } or { success, data: Project[] }
      if (d.success && d.data?.projects) {
        return d.data as ProjectsPagedResponse;
      } else if (d.success && Array.isArray(d.data)) {
        return { projects: d.data, pagination: { total: d.data.length, page: 1, limit: d.data.length, totalPages: 1 } };
      } else if (Array.isArray(d)) {
        return { projects: d, pagination: { total: d.length, page: 1, limit: d.length, totalPages: 1 } };
      }
      return { projects: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch projects');
    }
  }

  async getProjectsByStatus(status: string): Promise<Project[]> {
    try {
      const response = await apiService.get<any>(`/projects/status/${status}`);
      const d = response.data;
      if (d.success && Array.isArray(d.data)) return d.data;
      if (Array.isArray(d)) return d;
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch projects by status');
    }
  }

  async getProjectsByType(type: string): Promise<Project[]> {
    try {
      const response = await apiService.get<any>(`/projects/type/${type}`);
      const d = response.data;
      if (d.success && Array.isArray(d.data)) return d.data;
      if (Array.isArray(d)) return d;
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch projects by type');
    }
  }

  async updateProjectStatus(id: string, data: { status?: string; phase?: string; actualEndDate?: string }): Promise<Project> {
    try {
      const response = await apiService.patch<any>(`/projects/${id}/status`, data);
      const d = response.data;
      if (d.success && d.data?.project) return d.data.project;
      if (d.success && d.data) return d.data;
      throw new Error('Failed to update project status');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update project status');
    }
  }

  async assignProjectManager(id: string, projectManagerId: string): Promise<Project> {
    try {
      const response = await apiService.patch<any>(`/projects/${id}/assign-manager`, { projectManagerId });
      const d = response.data;
      if (d.success && d.data?.project) return d.data.project;
      if (d.success && d.data) return d.data;
      throw new Error('Failed to assign project manager');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to assign project manager');
    }
  }

  async getProjectDashboard(id: string): Promise<ProjectDashboardData> {
    try {
      const response = await apiService.get<any>(`/projects/${id}/dashboard`);
      const d = response.data;
      if (d.success && d.data) return d.data;
      throw new Error('Failed to fetch project dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project dashboard');
    }
  }
}

export const projectService = new ProjectService();
export { ProjectStatus, ProjectPhase, ProjectType };