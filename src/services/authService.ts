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
  role?: UserRole;
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
      console.log('Attempting login with credentials:', { email: credentials.email });
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        this.setToken(response.data.data.token);
        this.setUser(response.data.data.user);
        console.log('Login successful, token and user stored');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>('/auth/register', userData);
      
      if (response.data.success) {
        this.setToken(response.data.data.token);
        this.setUser(response.data.data.user);
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
      console.warn('Logout request failed:', error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get<UserResponse>('/auth/me');
      
      if (response.data.success) {
        this.setUser(response.data.data);
        return response.data.data;
      }
      
      throw new Error('Failed to get current user');
    } catch (error: any) {
      // If getting current user fails, clear local data
      this.removeToken();
      this.removeUser();
      throw new Error(error.response?.data?.message || 'Failed to get current user');
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await apiService.post<{ success: boolean; data: { token: string } }>('/auth/refresh');
      
      if (response.data.success) {
        this.setToken(response.data.data.token);
        return response.data.data.token;
      }
      
      throw new Error('Token refresh failed');
    } catch (error: any) {
      this.removeToken();
      this.removeUser();
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  // User management methods
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<UsersResponse>('/users');
      console.log('getUsers API response:', response.data);
      console.log('Response success:', response.data.success);
      console.log('Response data:', response.data.data);
      console.log('Data type:', typeof response.data.data);
      console.log('Is array:', Array.isArray(response.data.data));
      
      if (response.data.success) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          return data;
        } else if (data && typeof data === 'object') {
          // Handle case where data might be wrapped in another object
          console.warn('Data is object, checking for users array inside:', data);
          if (Array.isArray(data.users)) {
            return data.users;
          } else if (Array.isArray(data.data)) {
            return data.data;
          }
        }
        console.error('API returned non-array data:', data);
        return [];
      } else {
        console.warn('API returned success: false');
        return [];
      }
    } catch (error: any) {
      console.error('getUsers error:', error);
      console.error('Error response:', error.response?.data);
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
    try {
      const response = await apiService.put<UserResponse>(`/users/${id}`, userData);
      
      if (response.data.success) {
        return response.data.data;
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
      const response = await apiService.get<UsersResponse>(`/users/role/${role}`);
      return response.data.success ? response.data.data : [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users by role');
    }
  }

  async getUserStats(): Promise<UserStatsResponse['data']> {
    try {
      const response = await apiService.get<UserStatsResponse>('/users/stats');
      return response.data.success ? response.data.data : {
        totalUsers: 0,
        activeUsers: 0,
        usersByRole: {}
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user statistics');
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