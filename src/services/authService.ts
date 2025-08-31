import { apiService } from './api';
import { User, LoginRequest, RegisterRequest, ApiResponse } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RefreshTokenResponse {
  token: string;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return response.data;
  }

  async register(
    userData: RegisterRequest
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await apiService.post<AuthResponse>(
      '/auth/register',
      userData
    );
    return response.data;
  }

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const response =
      await apiService.post<RefreshTokenResponse>('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/logout');
    return response.data;
  }

  async updateProfile(
    userData: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> {
    const response = await apiService.put<{ user: User }>(
      '/auth/profile',
      userData
    );
    return response.data;
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/reset-password', {
      email,
    });
    return response.data;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/verify-email', {
      token,
    });
    return response.data;
  }

  async resendVerificationEmail(): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/resend-verification');
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await apiService.get<{ user: User }>('/auth/me');
    return response.data;
  }
}

export const authService = new AuthService();
