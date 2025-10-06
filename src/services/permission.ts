import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// API base is provided by shared apiClient using VITE_API_URL

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Types
export interface Permission {
  id: string;
  userId: string;
  adminId?: string;
  pengadaanId: string;
  permissionType: 'edit_form' | 'delete_form';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reason: string;
  adminResponse?: string;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionRequest {
  pengadaanId: string;
  permissionType?: 'edit_form' | 'delete_form';
  reason: string;
}

export interface PermissionResponse {
  status: 'approved' | 'rejected';
  response?: string;
}

export interface PermissionStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  expiredRequests: number;
}

// API Functions
const permissionApi = {
  // Request permission
  requestPermission: async (data: PermissionRequest): Promise<Permission> => {
    const result = await apiClient.post<ApiResponse<Permission>>('/permissions/request', data);
    return result.data;
  },

  // Get user's permissions
  getUserPermissions: async (page = 1, limit = 10): Promise<{ permissions: Permission[]; total: number; page: number; totalPages: number }> => {
    const result = await apiClient.get<ApiResponse<{ permissions: Permission[]; total: number; page: number; totalPages: number }>>(`/permissions/my-requests?page=${page}&limit=${limit}`);
    return result.data;
  },

  // Check edit permission
  checkEditPermission: async (pengadaanId: string): Promise<{ hasPermission: boolean; permission?: Permission }> => {
    const result = await apiClient.get<ApiResponse<{ hasPermission: boolean; permission?: Permission }>>(`/permissions/check/${pengadaanId}`);
    return result.data;
  },

  // Revoke permission
  revokePermission: async (permissionId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/permissions/${permissionId}`);
  },

  // Admin: Get pending requests
  getPendingRequests: async (page = 1, limit = 10): Promise<{ permissions: Permission[]; total: number; page: number; totalPages: number }> => {
    const result = await apiClient.get<ApiResponse<{ permissions: Permission[]; total: number; page: number; totalPages: number }>>(`/permissions/pending?page=${page}&limit=${limit}`);
    return result.data;
  },

  // Admin: Respond to request
  respondToRequest: async (permissionId: string, data: PermissionResponse): Promise<Permission> => {
    const result = await apiClient.put<ApiResponse<Permission>>(`/permissions/${permissionId}/respond`, data);
    return result.data;
  },

  // Admin: Get permission stats
  getPermissionStats: async (): Promise<PermissionStats> => {
    const result = await apiClient.get<ApiResponse<PermissionStats>>('/permissions/stats');
    return result.data;
  },

  // Admin: Bulk respond to requests
  bulkRespondToRequests: async (data: { permissionIds: string[]; status: 'approved' | 'rejected'; response?: string }): Promise<{ processed: number; failed: number }> => {
    const result = await apiClient.post<ApiResponse<{ processed: number; failed: number }>>('/permissions/bulk-respond', data);
    return result.data;
  },
};

// React Query Hooks
export const useRequestPermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: permissionApi.requestPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permission-check'] });
    },
  });
};

export const useGetUserPermissions = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['permissions', 'user', page, limit],
    queryFn: () => permissionApi.getUserPermissions(page, limit),
  });
};

export const useCheckEditPermission = (pengadaanId: string) => {
  return useQuery({
    queryKey: ['permission-check', pengadaanId],
    queryFn: () => permissionApi.checkEditPermission(pengadaanId),
    enabled: !!pengadaanId,
  });
};

export const useRevokePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: permissionApi.revokePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permission-check'] });
    },
  });
};

export const useGetPendingRequests = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['permissions', 'pending', page, limit],
    queryFn: () => permissionApi.getPendingRequests(page, limit),
  });
};

export const useRespondToRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ permissionId, data }: { permissionId: string; data: PermissionResponse }) =>
      permissionApi.respondToRequest(permissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permission-check'] });
    },
  });
};

export const useGetPermissionStats = () => {
  return useQuery({
    queryKey: ['permissions', 'stats'],
    queryFn: permissionApi.getPermissionStats,
  });
};

export const useBulkRespondToRequests = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: permissionApi.bulkRespondToRequests,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['permission-check'] });
    },
  });
};