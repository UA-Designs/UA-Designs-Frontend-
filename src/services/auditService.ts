import { apiService } from './api';
import type {
  AuditLogEntry,
  AuditLogMeta,
  AuditLogFilters,
  AuditEntity,
} from '../types';

export interface AuditLogListResponse {
  success: true;
  data: AuditLogEntry[];
  meta: AuditLogMeta;
}

export interface AuditLogDetailResponse {
  success: true;
  data: AuditLogEntry;
}

export const auditService = {
  /**
   * Fetch paginated audit logs with optional filters.
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiService.get<AuditLogListResponse>(`/audit/logs${query}`);
    return response.data;
  },

  /**
   * Fetch a single audit log entry by ID.
   */
  async getLogById(id: string): Promise<AuditLogDetailResponse> {
    const response = await apiService.get<AuditLogDetailResponse>(`/audit/logs/${id}`);
    return response.data;
  },

  /**
   * Fetch all audit log entries for a specific user.
   */
  async getLogsByUser(
    userId: string,
    opts: Pick<AuditLogFilters, 'page' | 'limit' | 'sortOrder'> = {}
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    Object.entries(opts).forEach(([k, v]) => {
      if (v !== undefined && v !== null && (v as unknown) !== '') params.append(k, String(v));
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiService.get<AuditLogListResponse>(`/audit/logs/user/${userId}${query}`);
    return response.data;
  },

  /**
   * Fetch the full audit trail for a specific entity record.
   */
  async getEntityTrail(
    entity: AuditEntity,
    entityId: string,
    opts: Pick<AuditLogFilters, 'page' | 'limit' | 'sortOrder'> = {}
  ): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    Object.entries(opts).forEach(([k, v]) => {
      if (v !== undefined && v !== null && (v as unknown) !== '') params.append(k, String(v));
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiService.get<AuditLogListResponse>(
      `/audit/logs/entity/${entity}/${entityId}${query}`
    );
    return response.data;
  },
};
