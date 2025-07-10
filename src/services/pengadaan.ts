import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// Simulated API calls with localStorage
const STORAGE_KEY = "pengadaan_data";

const getPengadaanData = (): Pengadaan[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
};

const savePengadaanData = (data: Pengadaan[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    throw new Error("Failed to save data");
  }
};

const generateNewId = (existingData: Pengadaan[]): string => {
  const existingIds = existingData.map((item) => {
    const match = item.id.match(/PGD-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  const maxId = Math.max(0, ...existingIds);
  return `PGD-${String(maxId + 1).padStart(3, "0")}`;
};

// CRUD Operations

export const useGetPengadaan = () => {
  return useQuery<Pengadaan[], Error>({
    queryKey: ["pengadaan"],
    queryFn: getPengadaanData,
  });
};

export const useCreatePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<Pengadaan, Error, Omit<Pengadaan, "id">>({
    mutationFn: async (
      newPengadaan: Omit<Pengadaan, "id">
    ): Promise<Pengadaan> => {
      const data = getPengadaanData();
      const id = generateNewId(data);
      const pengadaan = { ...newPengadaan, id };
      savePengadaanData([...data, pengadaan]);
      return pengadaan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengadaan"] });
    },
  });
};

export const useUpdatePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<Pengadaan, Error, Pengadaan>({
    mutationFn: async (updatedPengadaan: Pengadaan): Promise<Pengadaan> => {
      const data = getPengadaanData();
      const exists = data.some((item) => item.id === updatedPengadaan.id);
      if (!exists) {
        throw new Error(`Pengadaan with ID ${updatedPengadaan.id} not found`);
      }
      const updatedData = data.map((item) =>
        item.id === updatedPengadaan.id ? updatedPengadaan : item
      );
      savePengadaanData(updatedData);
      return updatedPengadaan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengadaan"] });
    },
  });
};

export const useDeletePengadaan = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (id: string): Promise<string> => {
      const data = getPengadaanData();
      const exists = data.some((item) => item.id === id);
      if (!exists) {
        throw new Error(`Pengadaan with ID ${id} not found`);
      }
      const updatedData = data.filter((item) => item.id !== id);
      savePengadaanData(updatedData);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pengadaan"] });
    },
  });
};
