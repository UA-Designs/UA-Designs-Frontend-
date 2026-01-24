import { apiService } from './api';
import { User, UserFilters, UserRole, UserStats } from '../types';

export interface UsersListResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserPermissionsResponse {
  permissions: Record<string, string[]>;
  approvalLevel?: string;
}

class UserService {
  private normalizeListResponse(payload: any): UsersListResult {
    const fallback: UsersListResult = {
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    if (!payload) return fallback;

    const data = payload.data ?? payload; // Handle both wrapped and raw responses

    if (Array.isArray(data)) {
      return {
        users: data,
        total: data.length,
        page: 1,
        limit: data.length || 10,
        totalPages: 1,
      };
    }

    if (Array.isArray(data?.users)) {
      const total = data.total || data.totalUsers || data.pagination?.total || data.meta?.total || data.users.length || 0;
      const page = data.page || data.pagination?.page || data.meta?.page || 1;
      const limit = data.limit || data.pagination?.limit || data.meta?.limit || data.users.length || 10;
      const totalPages = data.totalPages || data.pagination?.totalPages || data.meta?.totalPages || Math.ceil(total / (limit || 1)) || 1;

      return {
        users: data.users,
        total,
        page,
        limit,
        totalPages,
      };
    }

    if (Array.isArray(data?.data)) {
      const total = data.total || data.totalUsers || data.data.length || 0;
      const limit = data.limit || data.data.length || 10;
      return {
        users: data.data,
        total,
        page: data.page || 1,
        limit,
        totalPages: data.totalPages || Math.ceil(total / (limit || 1)) || 1,
      };
    }

    return fallback;
  }

  async list(filters: UserFilters = {}): Promise<UsersListResult> {
    try {
      const response = await apiService.get('/users', { params: filters });
      const payload = response.data?.success !== undefined ? response.data : { data: response.data };
      return this.normalizeListResponse(payload);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }

  async getById(id: string): Promise<User> {
    try {
      const response = await apiService.get(`/users/${id}`);
      const data = response.data?.data ?? response.data;
      return data.user || data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  }

  async create(userData: Partial<User> & { password?: string }): Promise<User> {
    try {
      const response = await apiService.post('/users', userData);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiService.put(`/users/${id}`, userData);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  async activate(id: string): Promise<User> {
    try {
      const response = await apiService.patch(`/users/${id}/activate`);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to activate user');
    }
  }

  async deactivate(id: string): Promise<User> {
    try {
      const response = await apiService.patch(`/users/${id}/deactivate`);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to deactivate user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiService.delete(`/users/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }

  async getPermissions(id: string): Promise<UserPermissionsResponse> {
    try {
      const response = await apiService.get(`/users/${id}/permissions`);
      const data = response.data?.data || response.data;
      return {
        permissions: data.permissions || {},
        approvalLevel: data.approvalLevel,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }

  async updatePermissions(id: string, payload: Partial<UserPermissionsResponse>): Promise<User> {
    try {
      const response = await apiService.put(`/users/${id}/permissions`, payload);
      return response.data?.data || response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update permissions');
    }
  }

  async getStats(): Promise<UserStats> {
    try {
      const response = await apiService.get('/users/stats/overview');
      const data = response.data?.data || response.data || {};
      return {
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        inactiveUsers: data.inactiveUsers || Math.max((data.totalUsers || 0) - (data.activeUsers || 0), 0),
        roleBreakdown: data.roleBreakdown || data.roleStats || data.usersByRole || {},
        recentUsers: data.recentUsers || [],
      };
    } catch (error: any) {
      // Attempt legacy stats endpoint before failing
      try {
        const fallback = await apiService.get('/users/stats');
        const data = fallback.data?.data || fallback.data || {};
        return {
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          inactiveUsers: data.inactiveUsers || Math.max((data.totalUsers || 0) - (data.activeUsers || 0), 0),
          roleBreakdown: data.roleBreakdown || data.roleStats || data.usersByRole || {},
          recentUsers: data.recentUsers || [],
        };
      } catch (fallbackError: any) {
        throw new Error(
          fallbackError.response?.data?.message ||
          error.response?.data?.message ||
          'Failed to fetch user statistics'
        );
      }
    }
  }
}

export const userService = new UserService();
