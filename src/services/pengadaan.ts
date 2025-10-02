import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_VERSION = 'v1';
const BASE_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

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

interface Pengadaan {
  id: string;
  // Legacy fields for backward compatibility
  nama: string;
  kategori: string;
  deskripsi: string;
  vendor: string;
  nilai: string;
  status: string;
  tanggal: string;
  deadline: string;
  
  // Section 1: DATA UMUM PENGADAAN
  sinergi: string;
  namaPaket: string;
  lapPtm: string;
  sla?: string;
  tahunSla?: string;
  costSaving?: string;
  tahunCostSaving?: string;
  barangJasa: string;

  // Section 2: PROSES PERSIAPAN PENGADAAN
  penggunaBarangJasa: string;
  jenisPaket: string;
  jenisPengadaan: string;
  baseline: string;
  noPpl: string;
  metodePengadaan: string;
  tahunAnggaran: string;
  jenisAnggaran: string;
  jenisKontrak: string;
  nilaiAnggaranIdr?: string;
  nilaiAnggaranUsd?: string;
  nilaiHpsCurrency: string;
  nilaiHpsAmount: string;
  nilaiHpsEqRupiah: string;
  nilaiHpsPortiTahun: string;
  bulanPermintaan: string;
  tanggalPermintaan: string;
  tanggalPermintaanDiterima: string;
  tanggalRapatPersiapan: string;
  tanggalRevisiPermintaan?: string;
  lamaRevisiPermintaan?: string;
  noPurchaseRequisition: string;
  tanggalPurchaseRequisition: string;
  jenisMySap: string;
  tanggalPerintahPengadaan: string;
  lamaProsesPersiapan: string;
  kategoriRisiko: string;
  keteranganPersiapan?: string;
  picTimPpsm: string;

  // Section 3: PROSES PENGADAAN
  suratPenunjukan: string;
  lamaProsesPengadaan: string;
  jangkaWaktuPengerjaan?: string;
  nilaiPenunjukanCurrency: string;
  nilaiPenunjukanAmount: string;
  nilaiPenunjukanEqRupiah: string;
  statusPengadaan: string;
  bulanSelesai: string;
  keteranganPengadaan?: string;

  // Section 4: PROSES KONTRAK
  costSavingRp?: string;
  nilaiKontrakRupiah?: string;
  nilaiKontrakUsd?: string;
  nilaiKontrakPortiTahun?: string;
  penyediaBarangJasa: string;
  statusPenyedia: string;
  kontrakNomor: string;
  kontrakTanggal: string;
}

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

  async create(data: Omit<Pengadaan, 'id'>): Promise<Pengadaan> {
    const response = await apiClient.post<ApiResponse<Pengadaan>>('/pengadaan', data);
    return response.data;
  },

  async update(id: string, data: Partial<Pengadaan>): Promise<Pengadaan> {
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

  async getStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/pengadaan/stats');
    return response.data;
  }
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

  return useMutation<Pengadaan, Error, Omit<Pengadaan, "id">>({
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
      console.error('Failed to create pengadaan:', error);
    },
  });
};

export const useUpdatePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<Pengadaan, Error, { id: string; data: Partial<Pengadaan> }>({
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
      console.error('Failed to update pengadaan:', error);
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
      console.error('Failed to delete pengadaan:', error);
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
