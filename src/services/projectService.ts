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
      console.log('ProjectService - Fetching projects from backend...');
      const response = await apiService.get<any>('/projects');
      console.log('ProjectService - Full response object:', response);
      console.log('ProjectService - Response status:', response.status);
      console.log('ProjectService - Response data:', response.data);
      console.log('ProjectService - Data type:', typeof response.data);
      console.log('ProjectService - Is array:', Array.isArray(response.data));
      
      // Handle various response formats from the backend
      // Format 1: { success: true, data: { projects: [...], pagination: {...} } }
      if (response.data.success && response.data.data?.projects && Array.isArray(response.data.data.projects)) {
        console.log('ProjectService - Using paginated response format, found', response.data.data.projects.length, 'projects');
        return response.data.data.projects;
      }
      // Format 2: { success: true, data: [...] }
      else if (response.data.success && Array.isArray(response.data.data)) {
        console.log('ProjectService - Using wrapped response format, found', response.data.data.length, 'projects');
        return response.data.data;
      } 
      // Format 3: Direct array response
      else if (Array.isArray(response.data)) {
        console.log('ProjectService - Using direct response format, found', response.data.length, 'projects');
        return response.data;
      } else {
        console.log('ProjectService - Unexpected response format:', response.data);
        console.log('ProjectService - Returning empty array');
        return [];
      }
    } catch (error: any) {
      console.error('ProjectService - Error fetching projects:', error);
      console.error('ProjectService - Error response:', error.response);
      console.error('ProjectService - Error message:', error.message);
      
      // Handle authentication errors specifically
      if (error.response?.data?.message === 'Access token required') {
        console.error('ProjectService - Authentication failed - no valid token');
        // Don't throw error, just return empty array for now
        return [];
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch projects');
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
      console.log('ProjectService - Sending data:', projectData);
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
      console.error('ProjectService - Error details:', error.response?.data);
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