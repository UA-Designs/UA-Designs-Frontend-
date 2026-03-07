import { apiService } from './api';

// Enums matching backend
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DependencyType {
  FS = 'FS', // Finish-to-Start
  SS = 'SS', // Start-to-Start
  FF = 'FF', // Finish-to-Finish
  SF = 'SF', // Start-to-Finish
}

// Interfaces
export interface ScheduleTask {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  endDate?: string;
  duration?: number;
  progress: number;
  assignedTo?: string;
  isCritical?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: DependencyType;
}

export interface CreateTaskData {
  name: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
  duration?: number;
  progress?: number;
  assignedTo?: string;
  projectId?: string;
}

export interface UpdateTaskStatusData {
  status: TaskStatus;
  progress?: number;
}

export interface CreateDependencyData {
  predecessorTaskId: string;
  successorTaskId: string;
  type: DependencyType;
}

export interface ProjectScheduleData {
  tasks: ScheduleTask[];
  criticalPath?: string[];
  totalDuration?: number;
  startDate?: string;
  endDate?: string;
}

export interface CriticalPathData {
  criticalPath: ScheduleTask[];
  totalDuration: number;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class ScheduleService {
  // GET /api/schedule/projects/:projectId/tasks
  async getProjectTasks(projectId: string): Promise<ScheduleTask[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>(
        `/schedule/projects/${projectId}/tasks`
      );
      if (response.data.success) {
        const d = response.data.data;
        if (d?.tasks && Array.isArray(d.tasks)) return d.tasks;
        if (Array.isArray(d)) return d;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project tasks');
    }
  }

  // GET /api/schedule/tasks?projectId=uuid  (projectId REQUIRED)
  async getTasks(projectId: string): Promise<ScheduleTask[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>(
        `/schedule/tasks?projectId=${projectId}`
      );
      if (response.data.success) {
        const d = response.data.data;
        if (d?.tasks && Array.isArray(d.tasks)) return d.tasks;
        if (Array.isArray(d)) return d;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }

  // GET /api/schedule/tasks/:id
  async getTaskById(taskId: string): Promise<ScheduleTask | null> {
    try {
      const response = await apiService.get<ApiResponse<ScheduleTask>>(
        `/schedule/tasks/${taskId}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task');
    }
  }

  // POST /api/schedule/projects/:projectId/tasks
  async createProjectTask(projectId: string, taskData: CreateTaskData): Promise<ScheduleTask> {
    try {
      const response = await apiService.post<ApiResponse<ScheduleTask>>(
        `/schedule/projects/${projectId}/tasks`,
        taskData
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create task');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  }

  // POST /api/schedule/tasks  (projectId in body REQUIRED)
  async createTask(taskData: CreateTaskData & { projectId: string }): Promise<ScheduleTask> {
    try {
      const response = await apiService.post<ApiResponse<ScheduleTask>>(
        `/schedule/tasks`,
        taskData
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create task');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create task');
    }
  }

  // PUT /api/schedule/tasks/:id
  async updateTask(taskId: string, taskData: Partial<CreateTaskData>): Promise<ScheduleTask> {
    try {
      const response = await apiService.put<ApiResponse<ScheduleTask>>(
        `/schedule/tasks/${taskId}`,
        taskData
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update task');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update task');
    }
  }

  // PUT /api/schedule/tasks/:id/status
  async updateTaskStatus(taskId: string, data: UpdateTaskStatusData): Promise<ScheduleTask> {
    try {
      const response = await apiService.put<ApiResponse<ScheduleTask>>(
        `/schedule/tasks/${taskId}/status`,
        data
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update task status');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update task status');
    }
  }

  // DELETE /api/schedule/tasks/:id
  async deleteTask(taskId: string): Promise<void> {
    try {
      await apiService.delete(`/schedule/tasks/${taskId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete task');
    }
  }

  // GET /api/schedule/tasks/:id/dependencies
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    try {
      const response = await apiService.get<ApiResponse<TaskDependency[]>>(
        `/schedule/tasks/${taskId}/dependencies`
      );
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch task dependencies');
    }
  }

  // GET /api/schedule/projects/:projectId/dependencies
  async getProjectDependencies(projectId: string): Promise<TaskDependency[]> {
    try {
      const response = await apiService.get<ApiResponse<any>>(
        `/schedule/projects/${projectId}/dependencies`
      );
      if (response.data.success) {
        const d = response.data.data;
        if (d?.dependencies && Array.isArray(d.dependencies)) return d.dependencies;
        if (Array.isArray(d)) return d;
      }
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project dependencies');
    }
  }

  // POST /api/schedule/dependencies
  async createDependency(data: CreateDependencyData): Promise<TaskDependency> {
    try {
      const response = await apiService.post<ApiResponse<TaskDependency>>(
        `/schedule/dependencies`,
        data
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create dependency');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create dependency');
    }
  }

  // DELETE /api/schedule/dependencies/:id
  async deleteDependency(dependencyId: string): Promise<void> {
    try {
      await apiService.delete(`/schedule/dependencies/${dependencyId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete dependency');
    }
  }

  // GET /api/schedule/projects/:projectId/critical-path
  async getCriticalPath(projectId: string): Promise<CriticalPathData | null> {
    try {
      const response = await apiService.get<ApiResponse<CriticalPathData>>(
        `/schedule/projects/${projectId}/critical-path`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch critical path');
    }
  }

  // GET /api/schedule/projects/:projectId/schedule
  async getProjectSchedule(projectId: string): Promise<ProjectScheduleData | null> {
    try {
      const response = await apiService.get<ApiResponse<ProjectScheduleData>>(
        `/schedule/projects/${projectId}/schedule`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project schedule');
    }
  }
}

export const scheduleService = new ScheduleService();