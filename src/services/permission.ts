import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:3001/api';

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
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to request permission');
    }

    const result = await response.json();
    return result.data;
  },

  // Get user's permissions
  getUserPermissions: async (page = 1, limit = 10): Promise<{ permissions: Permission[]; total: number; page: number; totalPages: number }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/my-requests?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch permissions');
    }

    const result = await response.json();
    return result.data;
  },

  // Check edit permission
  checkEditPermission: async (pengadaanId: string): Promise<{ hasPermission: boolean; permission?: Permission }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/check/${pengadaanId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check permission');
    }

    const result = await response.json();
    return result.data;
  },

  // Revoke permission
  revokePermission: async (permissionId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to revoke permission');
    }
  },

  // Admin: Get pending requests
  getPendingRequests: async (page = 1, limit = 10): Promise<{ permissions: Permission[]; total: number; page: number; totalPages: number }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/pending?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch pending requests');
    }

    const result = await response.json();
    return result.data;
  },

  // Admin: Respond to request
  respondToRequest: async (permissionId: string, data: PermissionResponse): Promise<Permission> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/${permissionId}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to respond to request');
    }

    const result = await response.json();
    return result.data;
  },

  // Admin: Get permission stats
  getPermissionStats: async (): Promise<PermissionStats> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch permission stats');
    }

    const result = await response.json();
    return result.data;
  },

  // Admin: Bulk respond to requests
  bulkRespondToRequests: async (data: { permissionIds: string[]; status: 'approved' | 'rejected'; response?: string }): Promise<{ processed: number; failed: number }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/permissions/bulk-respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bulk respond to requests');
    }

    const result = await response.json();
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