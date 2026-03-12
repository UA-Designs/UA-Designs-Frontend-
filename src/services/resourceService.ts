import { apiService } from './api';

// ---- Interfaces ----

export interface Material {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CreateMaterialData {
  name: string;
  projectId?: string;
  unit: string;
  unitCost: number;
  quantity: number;
  description?: string;
  category?: string;
  supplier?: string;
  status?: string;
  deliveryDate?: string;
  location?: string;
  notes?: string;
  [key: string]: any;
}

export interface Labor {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CreateLaborData {
  name: string;
  [key: string]: any;
}

export interface Equipment {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CreateEquipmentData {
  name: string;
  [key: string]: any;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  [key: string]: any;
}

export interface TeamMember {
  id: string;
  name: string;
  [key: string]: any;
}

export interface CreateTeamMemberData {
  name: string;
  [key: string]: any;
}

export interface Skill {
  id: string;
  name: string;
  [key: string]: any;
}

export interface ResourceAllocation {
  id: string;
  [key: string]: any;
}

export interface CreateAllocationData {
  [key: string]: any;
}

export interface ResourceConflict {
  [key: string]: any;
}

export interface ResourceUtilization {
  projectId: string;
  [key: string]: any;
}

export interface ResourceSummary {
  projectId: string;
  teamMembersCount?: number;
  equipmentCount?: number;
  materialsCount?: number;
  utilizationPercent?: number;
  [key: string]: any;
}

// ---- API Response wrapper ----

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class ResourceService {
  // ==================== MATERIALS ====================

  // GET /api/resources/materials — optional ?projectId= (camelCase). API returns data: array, pagination.
  async getMaterials(projectId?: string): Promise<Material[]> {
    try {
      const params = projectId ? { projectId } : undefined;
      const response = await apiService.get<ApiResponse<Material[]>>('/resources/materials', { params });
      const d = response.data?.data;
      const list = Array.isArray(d) ? d : [];
      return response.data?.success ? list : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch materials');
    }
  }

  // GET /api/resources/materials/:id
  async getMaterialById(id: string): Promise<Material | null> {
    try {
      const response = await apiService.get<ApiResponse<Material>>(`/resources/materials/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch material');
    }
  }

  // POST /api/resources/materials — required: name, unit, unitCost, quantity; projectId optional (materials are global)
  async createMaterial(data: CreateMaterialData): Promise<Material> {
    try {
      const payload: Record<string, unknown> = {
        name: String(data.name).trim(),
        unit: data.unit ?? 'pcs',
        unitCost: Number(data.unitCost ?? data.defaultCost ?? 0),
        quantity: Number(data.quantity ?? 0),
      };
      if (data.projectId != null && data.projectId !== '') payload.projectId = data.projectId;
      if (data.description != null && data.description !== '') payload.description = data.description;
      if (data.category != null && data.category !== '') payload.category = data.category;
      if (data.supplier != null && data.supplier !== '') payload.supplier = data.supplier;
      if (data.status != null && data.status !== '') payload.status = data.status;
      if (data.deliveryDate != null && data.deliveryDate !== '') payload.deliveryDate = data.deliveryDate;
      if (data.location != null && data.location !== '') payload.location = data.location;
      if (data.notes != null && data.notes !== '') payload.notes = data.notes;
      const response = await apiService.post<ApiResponse<Material>>('/resources/materials', payload);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create material');
    } catch (error: any) {
      const err = error.response?.data;
      const msg = err?.message ?? err?.error ?? error.message;
      const details = Array.isArray(err?.errors) ? err.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ') : '';
      throw new Error(details ? `${msg} — ${details}` : msg || 'Failed to create material');
    }
  }

  // PUT /api/resources/materials/:id
  async updateMaterial(id: string, data: Partial<CreateMaterialData>): Promise<Material> {
    try {
      const response = await apiService.put<ApiResponse<Material>>(`/resources/materials/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update material');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update material');
    }
  }

  // DELETE /api/resources/materials/:id
  async deleteMaterial(id: string): Promise<void> {
    try {
      await apiService.delete(`/resources/materials/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete material');
    }
  }

  // ==================== LABOR ====================

  // GET /api/resources/labor — optional ?projectId= (camelCase). API returns data: array, pagination.
  async getLabor(projectId?: string): Promise<Labor[]> {
    try {
      const params = projectId ? { projectId } : undefined;
      const response = await apiService.get<ApiResponse<Labor[]>>('/resources/labor', { params });
      const d = response.data?.data;
      const list = Array.isArray(d) ? d : [];
      return response.data?.success ? list : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch labor');
    }
  }

  // GET /api/resources/labor/:id
  async getLaborById(id: string): Promise<Labor | null> {
    try {
      const response = await apiService.get<ApiResponse<Labor>>(`/resources/labor/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch labor');
    }
  }

  // POST /api/resources/labor
  async createLabor(data: CreateLaborData): Promise<Labor> {
    try {
      const response = await apiService.post<ApiResponse<Labor>>('/resources/labor', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create labor');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create labor');
    }
  }

  // PUT /api/resources/labor/:id
  async updateLabor(id: string, data: Partial<CreateLaborData>): Promise<Labor> {
    try {
      const response = await apiService.put<ApiResponse<Labor>>(`/resources/labor/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update labor');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update labor');
    }
  }

  // DELETE /api/resources/labor/:id
  async deleteLabor(id: string): Promise<void> {
    try {
      await apiService.delete(`/resources/labor/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete labor');
    }
  }

  // ==================== EQUIPMENT ====================

  // GET /api/resources/equipment
  // GET /api/resources/equipment — optional ?projectId= (camelCase). API returns data: array, pagination.
  async getEquipment(projectId?: string): Promise<Equipment[]> {
    try {
      const params = projectId ? { projectId } : undefined;
      const response = await apiService.get<ApiResponse<Equipment[]>>('/resources/equipment', { params });
      const d = response.data?.data;
      const list = Array.isArray(d) ? d : [];
      return response.data?.success ? list : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch equipment');
    }
  }

  // GET /api/resources/equipment/:id
  async getEquipmentById(id: string): Promise<Equipment | null> {
    try {
      const response = await apiService.get<ApiResponse<Equipment>>(`/resources/equipment/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch equipment');
    }
  }

  // POST /api/resources/equipment
  async createEquipment(data: CreateEquipmentData): Promise<Equipment> {
    try {
      const response = await apiService.post<ApiResponse<Equipment>>('/resources/equipment', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create equipment');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create equipment');
    }
  }

  // PUT /api/resources/equipment/:id
  async updateEquipment(id: string, data: Partial<CreateEquipmentData>): Promise<Equipment> {
    try {
      const response = await apiService.put<ApiResponse<Equipment>>(`/resources/equipment/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update equipment');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update equipment');
    }
  }

  // DELETE /api/resources/equipment/:id
  async deleteEquipment(id: string): Promise<void> {
    try {
      await apiService.delete(`/resources/equipment/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete equipment');
    }
  }

  // POST /api/resources/equipment/:id/maintenance
  async addMaintenance(id: string, data: any): Promise<MaintenanceRecord> {
    try {
      const response = await apiService.post<ApiResponse<MaintenanceRecord>>(
        `/resources/equipment/${id}/maintenance`,
        data
      );
      if (response.data.success) return response.data.data;
      throw new Error('Failed to add maintenance record');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add maintenance record');
    }
  }

  // GET /api/resources/equipment/:id/maintenance
  async getMaintenance(id: string): Promise<MaintenanceRecord[]> {
    try {
      const response = await apiService.get<ApiResponse<MaintenanceRecord[]>>(
        `/resources/equipment/${id}/maintenance`
      );
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch maintenance records');
    }
  }

  // ==================== TEAM ====================

  // GET /api/resources/team
  async getTeamMembers(projectId?: string): Promise<TeamMember[]> {
    try {
      const response = await apiService.get<ApiResponse<TeamMember[]>>('/resources/team', {
        params: projectId ? { projectId } : undefined,
      });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team members');
    }
  }

  // GET /api/resources/team/:id
  async getTeamMemberById(id: string): Promise<TeamMember | null> {
    try {
      const response = await apiService.get<ApiResponse<TeamMember>>(`/resources/team/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team member');
    }
  }

  // POST /api/resources/team
  async createTeamMember(data: CreateTeamMemberData): Promise<TeamMember> {
    try {
      const response = await apiService.post<ApiResponse<TeamMember>>('/resources/team', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create team member');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create team member');
    }
  }

  // PUT /api/resources/team/:id
  async updateTeamMember(id: string, data: Partial<CreateTeamMemberData>): Promise<TeamMember> {
    try {
      const response = await apiService.put<ApiResponse<TeamMember>>(`/resources/team/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update team member');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update team member');
    }
  }

  // DELETE /api/resources/team/:id
  async deleteTeamMember(id: string): Promise<void> {
    try {
      await apiService.delete(`/resources/team/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete team member');
    }
  }

  // GET /api/resources/team/:id/skills
  async getTeamMemberSkills(id: string): Promise<Skill[]> {
    try {
      const response = await apiService.get<ApiResponse<Skill[]>>(`/resources/team/${id}/skills`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch team member skills');
    }
  }

  // POST /api/resources/team/:id/skills
  async addTeamMemberSkill(id: string, data: any): Promise<Skill> {
    try {
      const response = await apiService.post<ApiResponse<Skill>>(`/resources/team/${id}/skills`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to add skill');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add skill');
    }
  }

  // ==================== ALLOCATIONS & REPORTING ====================

  // GET /api/resources/allocations
  async getAllocations(projectId?: string): Promise<ResourceAllocation[]> {
    try {
      const response = await apiService.get<ApiResponse<ResourceAllocation[]>>('/resources/allocations', {
        params: projectId ? { projectId } : undefined,
      });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch allocations');
    }
  }

  // POST /api/resources/allocations
  async createAllocation(data: CreateAllocationData): Promise<ResourceAllocation> {
    try {
      const response = await apiService.post<ApiResponse<ResourceAllocation>>('/resources/allocations', data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to create allocation');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create allocation');
    }
  }

  // PUT /api/resources/allocations/:id
  async updateAllocation(id: string, data: Partial<CreateAllocationData>): Promise<ResourceAllocation> {
    try {
      const response = await apiService.put<ApiResponse<ResourceAllocation>>(`/resources/allocations/${id}`, data);
      if (response.data.success) return response.data.data;
      throw new Error('Failed to update allocation');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update allocation');
    }
  }

  // DELETE /api/resources/allocations/:id
  async deleteAllocation(id: string): Promise<void> {
    try {
      await apiService.delete(`/resources/allocations/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete allocation');
    }
  }

  // GET /api/resources/conflicts
  async getConflicts(projectId?: string): Promise<ResourceConflict[]> {
    try {
      const response = await apiService.get<ApiResponse<ResourceConflict[]>>('/resources/conflicts', {
        params: projectId ? { projectId } : undefined,
      });
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch conflicts');
    }
  }

  // GET /api/resources/utilization/:projectId
  async getUtilization(projectId: string): Promise<ResourceUtilization | null> {
    try {
      const response = await apiService.get<ApiResponse<ResourceUtilization>>(
        `/resources/utilization/${projectId}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch utilization');
    }
  }

  // GET /api/resources/summary/:projectId
  async getSummary(projectId: string): Promise<ResourceSummary | null> {
    try {
      const response = await apiService.get<ApiResponse<ResourceSummary>>(
        `/resources/summary/${projectId}`
      );
      return response.data.success ? response.data.data : null;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch resource summary');
    }
  }
}

export const resourceService = new ResourceService();
