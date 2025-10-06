import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pengadaan, CreatePengadaanDTO, UpdatePengadaanDTO, PaginatedPengadaanResponse, PengadaanStats } from '@/types/pengadaan';
import { ApiClient } from '@/services/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_VERSION = 'v1';
const BASE_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// API Client is now shared in '@/services/api'

const apiClient = new ApiClient(BASE_URL);

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Use Pengadaan type from '@/types/pengadaan' to avoid duplicate interface conflicts

// API Service Functions
const pengadaanService = {
  async getAll(): Promise<Pengadaan[]> {
    const response = await apiClient.get<PaginatedResponse<Pengadaan>>('/pengadaan');
    return response.data;
  },

  async getById(id: string): Promise<Pengadaan> {
    const response = await apiClient.get<ApiResponse<Pengadaan>>(`/pengadaan/${id}`);
    return response.data;
  },

  async create(data: CreatePengadaanDTO): Promise<Pengadaan> {
    const response = await apiClient.post<ApiResponse<Pengadaan>>('/pengadaan', data);
    return response.data;
  },

  async update(id: string, data: UpdatePengadaanDTO): Promise<Pengadaan> {
    const response = await apiClient.put<ApiResponse<Pengadaan>>(`/pengadaan/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/pengadaan/${id}`);
  },

  async search(query: string): Promise<Pengadaan[]> {
    const response = await apiClient.get<PaginatedResponse<Pengadaan>>(`/pengadaan/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async getStats(): Promise<PengadaanStats> {
    const response = await apiClient.get<ApiResponse<PengadaanStats>>('/pengadaan/stats');
    return response.data;
  },
};

// React Query Hooks

export const useGetPengadaan = () => {
  return useQuery<Pengadaan[], Error>({
    queryKey: ["pengadaan"],
    queryFn: pengadaanService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
};

export const useGetPengadaanById = (id: string) => {
  return useQuery<Pengadaan, Error>({
    queryKey: ["pengadaan", id],
    queryFn: () => pengadaanService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<Pengadaan, Error, CreatePengadaanDTO>({
    mutationFn: pengadaanService.create,
    onSuccess: (newPengadaan) => {
      // Update the cache with the new item
      queryClient.setQueryData<Pengadaan[]>(["pengadaan"], (old) => {
        return old ? [...old, newPengadaan] : [newPengadaan];
      });
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["pengadaan"] });
    },
    onError: (error) => {
      // Improved error handling without console.log
      throw new Error(error instanceof Error ? error.message : 'Failed to create pengadaan');
    },
  });
};

export const useUpdatePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<Pengadaan, Error, { id: string; data: UpdatePengadaanDTO }>({
    mutationFn: ({ id, data }) => pengadaanService.update(id, data),
    onSuccess: (updatedPengadaan) => {
      // Update the cache
      queryClient.setQueryData<Pengadaan[]>(["pengadaan"], (old) => {
        return old?.map((item) =>
          item.id === updatedPengadaan.id ? updatedPengadaan : item
        ) || [];
      });
      // Update individual item cache
      queryClient.setQueryData(["pengadaan", updatedPengadaan.id], updatedPengadaan);
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["pengadaan"] });
    },
    onError: (error) => {
      // Improved error handling without console.log
      throw new Error(error instanceof Error ? error.message : 'Failed to update pengadaan');
    },
  });
};

export const useDeletePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: pengadaanService.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData<Pengadaan[]>(["pengadaan"], (old) => {
        return old?.filter((item) => item.id !== deletedId) || [];
      });
      // Remove individual item cache
      queryClient.removeQueries({ queryKey: ["pengadaan", deletedId] });
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["pengadaan"] });
    },
    onError: (error) => {
      // Improved error handling without console.log
      throw new Error(error instanceof Error ? error.message : 'Failed to delete pengadaan');
    },
  });
};

export const useSearchPengadaan = (query: string) => {
  return useQuery<Pengadaan[], Error>({
    queryKey: ["pengadaan", "search", query],
    queryFn: () => pengadaanService.search(query),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const usePengadaanStats = () => {
  return useQuery({
    queryKey: ["pengadaan", "stats"],
    queryFn: pengadaanService.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Export the service for direct use if needed
export { pengadaanService };
