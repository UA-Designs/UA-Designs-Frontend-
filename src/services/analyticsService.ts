import { apiService } from './api';
import type { OverviewResponse, ProjectAnalyticsResponse } from '../types/analytics';

export const analyticsService = {
  async getOverview(): Promise<OverviewResponse> {
    const response = await apiService.get<OverviewResponse>('/analytics/overview');
    return response.data;
  },

  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsResponse> {
    const response = await apiService.get<ProjectAnalyticsResponse>(
      `/analytics/project/${projectId}`
    );
    return response.data;
  },
};
