import { apiService } from './api';
import { User, UserRole } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data: User;
}

export interface UsersResponse {
  success: boolean;
  message?: string;
  data: User[];
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
  };
}

class AuthService {
  private readonly TOKEN_KEY = 'ua_designs_token';
  private readonly USER_KEY = 'ua_designs_user';

  /** Normalize backend user — handles both `id` and `_id` fields */
  private normalizeUser(u: any): User {
    return { ...u, id: u.id ?? u._id ?? u.userId };
  }

  // Token management
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // User management
  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      
      if (response.data.success) {
        const normalizedUser = this.normalizeUser(response.data.data.user);
        this.setToken(response.data.data.token);
        this.setUser(normalizedUser);
        response.data.data.user = normalizedUser;
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>('/auth/register', userData);
      
      if (response.data.success) {
        const normalizedUser = this.normalizeUser(response.data.data.user);
        this.setToken(response.data.data.token);
        this.setUser(normalizedUser);
        response.data.data.user = normalizedUser;
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local data
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<UserResponse>('/auth/me');
      
      if (response.data.success) {
        const normalizedUser = this.normalizeUser(response.data.data);
        this.setUser(normalizedUser);
        return normalizedUser;
      }
      
      throw new Error('Failed to get current user');
    } catch (error: any) {
      // If getting current user fails, clear local data
      this.removeToken();
      this.removeUser();
      throw new Error(error.response?.data?.message || 'Failed to get current user');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  // User management methods
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<UsersResponse>('/users?limit=500');
      
      if (response.data.success) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          return data;
        } else if (data && typeof data === 'object') {
          if (Array.isArray((data as any).users)) {
            return (data as any).users;
          } else if (Array.isArray((data as any).data)) {
            return (data as any).data;
          }
        }
        return [];
      } else {
        return [];
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const response = await apiService.get<UserResponse>(`/users/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('User not found');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const response = await apiService.post<UserResponse>('/users', userData);
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to create user');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    if (!id || id === 'undefined') {
      throw new Error('Cannot update user: user ID is missing. Please log out and log back in.');
    }
    try {
      const response = await apiService.put<UserResponse>(`/users/${id}`, userData);
      
      if (response.data.success) {
        const raw = response.data.data;
        // Backend may return minimal/null data — always preserve the known id
        const normalized = this.normalizeUser(raw ?? { id });
        return { ...normalized, id: normalized.id ?? id };
      }
      
      throw new Error('Failed to update user');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await apiService.delete(`/users/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const response = await apiService.get<any>(`/users/role/${role}`);
      const payload = response.data?.data ?? response.data;
      if (Array.isArray(payload)) return payload;
      if (payload && Array.isArray(payload.users)) return payload.users;
      return [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users by role');
    }
  }

  async getUserStats(): Promise<UserStatsResponse['data']> {
    try {
      const response = await apiService.get<UserStatsResponse>('/users/stats/overview');
      return response.data.success ? response.data.data : {
        totalUsers: 0,
        activeUsers: 0,
        usersByRole: {}
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user statistics');
    }
  }

  async activateUser(id: string): Promise<void> {
    try {
      await apiService.patch(`/users/${id}/activate`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to activate user');
    }
  }

  async deactivateUser(id: string): Promise<void> {
    try {
      await apiService.patch(`/users/${id}/deactivate`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to deactivate user');
    }
  }

  async getUserPermissions(id: string): Promise<any> {
    try {
      const response = await apiService.get<{ success: boolean; data: any }>(`/users/${id}/permissions`);
      return response.data.success ? response.data.data : {};
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }

  async updateUserPermissions(id: string, permissions: Record<string, any>, approvalLevel?: number): Promise<void> {
    try {
      await apiService.put(`/users/${id}/permissions`, { permissions, approvalLevel });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update permissions');
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: UserRole): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isProjectManager(): boolean {
    return this.hasRole(UserRole.PROJECT_MANAGER);
  }

  canManageUsers(): boolean {
    return this.hasAnyRole([UserRole.ADMIN, UserRole.PROJECT_MANAGER]);
  }
}

export const authService = new AuthService();