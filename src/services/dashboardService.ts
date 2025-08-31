import axios from 'axios';
import {
  DashboardStats,
  ProjectProgress,
  TaskProgress,
  CostVariance,
  RiskMatrix,
  RecentActivity,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  async getProjectProgress(): Promise<ProjectProgress[]> {
    const response = await api.get('/dashboard/project-progress');
    return response.data;
  },

  async getTaskProgress(): Promise<TaskProgress[]> {
    const response = await api.get('/dashboard/task-progress');
    return response.data;
  },

  async getCostVariance(): Promise<CostVariance[]> {
    const response = await api.get('/dashboard/cost-variance');
    return response.data;
  },

  async getRiskMatrix(): Promise<RiskMatrix> {
    const response = await api.get('/dashboard/risk-matrix');
    return response.data;
  },

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    const response = await api.get(
      `/dashboard/recent-activities?limit=${limit}`
    );
    return response.data;
  },

  async getProjectTimeline(projectId: string): Promise<any[]> {
    const response = await api.get(`/dashboard/project-timeline/${projectId}`);
    return response.data;
  },

  async getResourceUtilization(): Promise<any[]> {
    const response = await api.get('/dashboard/resource-utilization');
    return response.data;
  },

  async getQualityMetrics(): Promise<any[]> {
    const response = await api.get('/dashboard/quality-metrics');
    return response.data;
  },
};
