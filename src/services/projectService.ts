import { apiService } from './api';
import {
  Project,
  Task,
  User,
  Resource,
  Risk,
  QualityCheck,
  Communication,
  Stakeholder,
  Procurement,
  ApiResponse,
  PaginatedResponse,
} from '../types';

class ProjectService {
  // Project methods
  async getProjects(params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Project>>> {
    const response = await apiService.get<PaginatedResponse<Project>>(
      '/projects',
      { params }
    );
    return response.data;
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const response = await apiService.get<Project>(`/projects/${id}`);
    return response.data;
  }

  async createProject(
    projectData: Partial<Project>
  ): Promise<ApiResponse<Project>> {
    const response = await apiService.post<Project>('/projects', projectData);
    return response.data;
  }

  async updateProject(
    id: string,
    projectData: Partial<Project>
  ): Promise<ApiResponse<Project>> {
    const response = await apiService.put<Project>(
      `/projects/${id}`,
      projectData
    );
    return response.data;
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/projects/${id}`);
    return response.data;
  }

  async getProjectStats(id: string): Promise<ApiResponse<any>> {
    const response = await apiService.get<any>(`/projects/${id}/stats`);
    return response.data;
  }

  // Task methods
  async getTasks(
    projectId?: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      assignedTo?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Task>>> {
    const url = projectId ? `/projects/${projectId}/tasks` : '/tasks';
    const response = await apiService.get<PaginatedResponse<Task>>(url, {
      params,
    });
    return response.data;
  }

  async getTask(id: string): Promise<ApiResponse<Task>> {
    const response = await apiService.get<Task>(`/tasks/${id}`);
    return response.data;
  }

  async createTask(taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    const response = await apiService.post<Task>('/tasks', taskData);
    return response.data;
  }

  async updateTask(
    id: string,
    taskData: Partial<Task>
  ): Promise<ApiResponse<Task>> {
    const response = await apiService.put<Task>(`/tasks/${id}`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/tasks/${id}`);
    return response.data;
  }

  async assignTask(taskId: string, userId: string): Promise<ApiResponse<Task>> {
    const response = await apiService.post<Task>(`/tasks/${taskId}/assign`, {
      userId,
    });
    return response.data;
  }

  async updateTaskProgress(
    id: string,
    progress: number
  ): Promise<ApiResponse<Task>> {
    const response = await apiService.patch<Task>(`/tasks/${id}/progress`, {
      progress,
    });
    return response.data;
  }

  // Resource methods
  async getResources(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
  }): Promise<ApiResponse<PaginatedResponse<Resource>>> {
    const response = await apiService.get<PaginatedResponse<Resource>>(
      '/resources',
      { params }
    );
    return response.data;
  }

  async getResource(id: string): Promise<ApiResponse<Resource>> {
    const response = await apiService.get<Resource>(`/resources/${id}`);
    return response.data;
  }

  async createResource(
    resourceData: Partial<Resource>
  ): Promise<ApiResponse<Resource>> {
    const response = await apiService.post<Resource>(
      '/resources',
      resourceData
    );
    return response.data;
  }

  async updateResource(
    id: string,
    resourceData: Partial<Resource>
  ): Promise<ApiResponse<Resource>> {
    const response = await apiService.put<Resource>(
      `/resources/${id}`,
      resourceData
    );
    return response.data;
  }

  async deleteResource(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/resources/${id}`);
    return response.data;
  }

  // Risk methods
  async getRisks(
    projectId?: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      category?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Risk>>> {
    const url = projectId ? `/projects/${projectId}/risks` : '/risks';
    const response = await apiService.get<PaginatedResponse<Risk>>(url, {
      params,
    });
    return response.data;
  }

  async getRisk(id: string): Promise<ApiResponse<Risk>> {
    const response = await apiService.get<Risk>(`/risks/${id}`);
    return response.data;
  }

  async createRisk(riskData: Partial<Risk>): Promise<ApiResponse<Risk>> {
    const response = await apiService.post<Risk>('/risks', riskData);
    return response.data;
  }

  async updateRisk(
    id: string,
    riskData: Partial<Risk>
  ): Promise<ApiResponse<Risk>> {
    const response = await apiService.put<Risk>(`/risks/${id}`, riskData);
    return response.data;
  }

  async deleteRisk(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/risks/${id}`);
    return response.data;
  }

  // Quality Check methods
  async getQualityChecks(
    projectId?: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<QualityCheck>>> {
    const url = projectId
      ? `/projects/${projectId}/quality-checks`
      : '/quality-checks';
    const response = await apiService.get<PaginatedResponse<QualityCheck>>(
      url,
      { params }
    );
    return response.data;
  }

  async getQualityCheck(id: string): Promise<ApiResponse<QualityCheck>> {
    const response = await apiService.get<QualityCheck>(
      `/quality-checks/${id}`
    );
    return response.data;
  }

  async createQualityCheck(
    qualityCheckData: Partial<QualityCheck>
  ): Promise<ApiResponse<QualityCheck>> {
    const response = await apiService.post<QualityCheck>(
      '/quality-checks',
      qualityCheckData
    );
    return response.data;
  }

  async updateQualityCheck(
    id: string,
    qualityCheckData: Partial<QualityCheck>
  ): Promise<ApiResponse<QualityCheck>> {
    const response = await apiService.put<QualityCheck>(
      `/quality-checks/${id}`,
      qualityCheckData
    );
    return response.data;
  }

  async deleteQualityCheck(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/quality-checks/${id}`);
    return response.data;
  }

  // Communication methods
  async getCommunications(
    projectId?: string,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Communication>>> {
    const url = projectId
      ? `/projects/${projectId}/communications`
      : '/communications';
    const response = await apiService.get<PaginatedResponse<Communication>>(
      url,
      { params }
    );
    return response.data;
  }

  async getCommunication(id: string): Promise<ApiResponse<Communication>> {
    const response = await apiService.get<Communication>(
      `/communications/${id}`
    );
    return response.data;
  }

  async createCommunication(
    communicationData: Partial<Communication>
  ): Promise<ApiResponse<Communication>> {
    const response = await apiService.post<Communication>(
      '/communications',
      communicationData
    );
    return response.data;
  }

  async updateCommunication(
    id: string,
    communicationData: Partial<Communication>
  ): Promise<ApiResponse<Communication>> {
    const response = await apiService.put<Communication>(
      `/communications/${id}`,
      communicationData
    );
    return response.data;
  }

  async deleteCommunication(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/communications/${id}`);
    return response.data;
  }

  // Stakeholder methods
  async getStakeholders(
    projectId?: string,
    params?: {
      page?: number;
      limit?: number;
      type?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Stakeholder>>> {
    const url = projectId
      ? `/projects/${projectId}/stakeholders`
      : '/stakeholders';
    const response = await apiService.get<PaginatedResponse<Stakeholder>>(url, {
      params,
    });
    return response.data;
  }

  async getStakeholder(id: string): Promise<ApiResponse<Stakeholder>> {
    const response = await apiService.get<Stakeholder>(`/stakeholders/${id}`);
    return response.data;
  }

  async createStakeholder(
    stakeholderData: Partial<Stakeholder>
  ): Promise<ApiResponse<Stakeholder>> {
    const response = await apiService.post<Stakeholder>(
      '/stakeholders',
      stakeholderData
    );
    return response.data;
  }

  async updateStakeholder(
    id: string,
    stakeholderData: Partial<Stakeholder>
  ): Promise<ApiResponse<Stakeholder>> {
    const response = await apiService.put<Stakeholder>(
      `/stakeholders/${id}`,
      stakeholderData
    );
    return response.data;
  }

  async deleteStakeholder(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/stakeholders/${id}`);
    return response.data;
  }

  // Procurement methods
  async getProcurements(
    projectId?: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Procurement>>> {
    const url = projectId
      ? `/projects/${projectId}/procurements`
      : '/procurements';
    const response = await apiService.get<PaginatedResponse<Procurement>>(url, {
      params,
    });
    return response.data;
  }

  async getProcurement(id: string): Promise<ApiResponse<Procurement>> {
    const response = await apiService.get<Procurement>(`/procurements/${id}`);
    return response.data;
  }

  async createProcurement(
    procurementData: Partial<Procurement>
  ): Promise<ApiResponse<Procurement>> {
    const response = await apiService.post<Procurement>(
      '/procurements',
      procurementData
    );
    return response.data;
  }

  async updateProcurement(
    id: string,
    procurementData: Partial<Procurement>
  ): Promise<ApiResponse<Procurement>> {
    const response = await apiService.put<Procurement>(
      `/procurements/${id}`,
      procurementData
    );
    return response.data;
  }

  async deleteProcurement(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/procurements/${id}`);
    return response.data;
  }

  // User methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await apiService.get<PaginatedResponse<User>>('/users', {
      params,
    });
    return response.data;
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await apiService.get<User>(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiService.post<User>('/users', userData);
    return response.data;
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    const response = await apiService.put<User>(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await apiService.delete<void>(`/users/${id}`);
    return response.data;
  }

  // File upload methods
  async uploadProjectFile(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> {
    const response = await apiService.uploadFile<any>(
      `/projects/${projectId}/files`,
      file,
      onProgress
    );
    return response.data;
  }

  async uploadTaskFile(
    taskId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<any>> {
    const response = await apiService.uploadFile<any>(
      `/tasks/${taskId}/files`,
      file,
      onProgress
    );
    return response.data;
  }

  // Export methods
  async exportProjectReport(
    projectId: string,
    format: 'pdf' | 'excel'
  ): Promise<void> {
    await apiService.downloadFile(
      `/projects/${projectId}/export?format=${format}`,
      `project-${projectId}-report.${format}`
    );
  }

  async exportTasksReport(
    projectId: string,
    format: 'pdf' | 'excel'
  ): Promise<void> {
    await apiService.downloadFile(
      `/projects/${projectId}/tasks/export?format=${format}`,
      `project-${projectId}-tasks.${format}`
    );
  }
}

export const projectService = new ProjectService();
