import { apiService } from './api';
import { Task, TaskStatus, TaskPriority } from '../types';

export interface TaskResponse {
  success: boolean;
  message?: string;
  data: Task;
}

export interface TasksResponse {
  success: boolean;
  message?: string;
  data: Task[];
}

export interface ProjectScheduleResponse {
  success: boolean;
  message?: string;
  data: {
    projectId: string;
    tasks: Task[];
    criticalPath: string[];
    totalDuration: number;
    startDate: string;
    endDate: string;
  };
}

export interface CriticalPathResponse {
  success: boolean;
  message?: string;
  data: {
    criticalPath: string[];
    totalDuration: number;
    slackTime: Record<string, number>;
  };
}

class ScheduleService {
  async getTasks(): Promise<Task[]> {
    try {
      const response = await apiService.get<TasksResponse>('/schedule/tasks');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }

  async createTask(taskData: any): Promise<Task> {
    try {
      const response = await apiService.post<TaskResponse>('/schedule/tasks', taskData);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to create task');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  }

  async getProjectSchedule(projectId: string): Promise<ProjectScheduleResponse['data']> {
    try {
      const response = await apiService.get<ProjectScheduleResponse>(`/schedule/projects/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to fetch project schedule');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project schedule');
    }
  }

  async getCriticalPath(projectId: string): Promise<CriticalPathResponse['data']> {
    try {
      const response = await apiService.get<CriticalPathResponse>(`/schedule/critical-path/${projectId}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to fetch critical path');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch critical path');
    }
  }

  async updateTask(id: string, taskData: any): Promise<Task> {
    try {
      const response = await apiService.put<TaskResponse>(`/schedule/tasks/${id}`, taskData);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to update task');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await apiService.delete(`/schedule/tasks/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    try {
      const response = await apiService.get<TasksResponse>(`/schedule/tasks/status/${status}`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks by status');
    }
  }

  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    try {
      const response = await apiService.get<TasksResponse>(`/schedule/tasks/priority/${priority}`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks by priority');
    }
  }

  async getOverdueTasks(): Promise<Task[]> {
    try {
      const response = await apiService.get<TasksResponse>('/schedule/tasks/overdue');
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch overdue tasks');
    }
  }

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    try {
      const response = await apiService.get<TasksResponse>(`/schedule/tasks/upcoming?days=${days}`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch upcoming tasks');
    }
  }
}

export const scheduleService = new ScheduleService();