import { apiService } from './api';
import {
  DashboardStats,
  ProjectProgress,
  TaskProgress,
  CostVariance,
  RiskMatrix,
  RecentActivity,
} from '../types';

export interface DashboardStatsResponse {
  success: boolean;
  message?: string;
  data: DashboardStats;
}

export interface ProjectProgressResponse {
  success: boolean;
  message?: string;
  data: ProjectProgress[];
}

export interface TaskProgressResponse {
  success: boolean;
  message?: string;
  data: TaskProgress[];
}

export interface CostVarianceResponse {
  success: boolean;
  message?: string;
  data: CostVariance[];
}

export interface RiskMatrixResponse {
  success: boolean;
  message?: string;
  data: RiskMatrix;
}

export interface RecentActivityResponse {
  success: boolean;
  message?: string;
  data: RecentActivity[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiService.get<DashboardStatsResponse>('/dashboard/stats');
      return response.data.success ? response.data.data : {
        totalProjects: 0,
        activeProjects: 0,
        completedTasks: 0,
        totalBudget: 0,
        costVariance: 0,
        scheduleVariance: 0,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  },

  async getProjectProgress(): Promise<ProjectProgress[]> {
    try {
      const response = await apiService.get<ProjectProgressResponse>('/dashboard/project-progress');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project progress');
    }
  },

  async getTaskProgress(): Promise<TaskProgress[]> {
    try {
      const response = await apiService.get<TaskProgressResponse>('/dashboard/task-progress');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task progress');
    }
  },

  async getCostVariance(): Promise<CostVariance[]> {
    try {
      const response = await apiService.get<CostVarianceResponse>('/dashboard/cost-variance');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cost variance');
    }
  },

  async getRiskMatrix(): Promise<RiskMatrix> {
    try {
      const response = await apiService.get<RiskMatrixResponse>('/dashboard/risk-matrix');
      return response.data.success ? response.data.data : {
        risks: [],
        matrix: []
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch risk matrix');
    }
  },

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await apiService.get<RecentActivityResponse>(
        `/dashboard/recent-activities?limit=${limit}`
      );
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recent activities');
    }
  },

  async getProjectTimeline(projectId: string): Promise<any[]> {
    try {
      const response = await apiService.get(`/dashboard/project-timeline/${projectId}`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project timeline');
    }
  },

  async getResourceUtilization(): Promise<any[]> {
    try {
      const response = await apiService.get('/dashboard/resource-utilization');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch resource utilization');
    }
  },

};
