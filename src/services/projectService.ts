import { apiService } from './api';
import { Project, ProjectStatus, ProjectPhase } from '../types';

export interface ProjectResponse {
  success: boolean;
  message?: string;
  data: Project;
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
      const response = await apiService.get<ProjectsResponse>('/projects');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch projects');
    }
  }

  async getProjectById(id: string): Promise<Project> {
    try {
      const response = await apiService.get<ProjectResponse>(`/projects/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Project not found');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project');
    }
  }

  async createProject(projectData: any): Promise<Project> {
    try {
      const response = await apiService.post<ProjectResponse>('/projects', projectData);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to create project');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create project');
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
      const response = await apiService.get<ProjectStatsResponse>('/projects/stats');
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
}

export const projectService = new ProjectService();