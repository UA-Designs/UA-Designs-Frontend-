import axios from 'axios';
import { Task, TaskStatus, GanttTask } from '../types';

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

export const scheduleService = {
  async getTasks(projectId?: string): Promise<Task[]> {
    const url = projectId
      ? `/schedule/tasks?projectId=${projectId}`
      : '/schedule/tasks';
    const response = await api.get(url);
    return response.data;
  },

  async getTask(taskId: string): Promise<Task> {
    const response = await api.get(`/schedule/tasks/${taskId}`);
    return response.data;
  },

  async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> {
    const response = await api.post('/schedule/tasks', task);
    return response.data;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await api.put(`/schedule/tasks/${taskId}`, updates);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/schedule/tasks/${taskId}`);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const response = await api.patch(`/schedule/tasks/${taskId}/status`, {
      status,
    });
    return response.data;
  },

  async updateTaskProgress(taskId: string, progress: number): Promise<Task> {
    const response = await api.patch(`/schedule/tasks/${taskId}/progress`, {
      progress,
    });
    return response.data;
  },

  async assignTask(taskId: string, userId: string): Promise<Task> {
    const response = await api.patch(`/schedule/tasks/${taskId}/assign`, {
      userId,
    });
    return response.data;
  },

  async getGanttData(projectId: string): Promise<GanttTask[]> {
    const response = await api.get(`/schedule/gantt/${projectId}`);
    return response.data;
  },

  async getCriticalPath(projectId: string): Promise<Task[]> {
    const response = await api.get(`/schedule/critical-path/${projectId}`);
    return response.data;
  },

  async getResourceAllocation(projectId: string): Promise<any[]> {
    const response = await api.get(
      `/schedule/resource-allocation/${projectId}`
    );
    return response.data;
  },

  async getScheduleVariance(projectId: string): Promise<any> {
    const response = await api.get(`/schedule/variance/${projectId}`);
    return response.data;
  },

  async exportSchedule(
    projectId: string,
    format: 'pdf' | 'excel'
  ): Promise<Blob> {
    const response = await api.get(
      `/schedule/export/${projectId}?format=${format}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
