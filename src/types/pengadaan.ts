// Frontend Pengadaan types based on backend interface

export interface Pengadaan {
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

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePengadaanDTO = Omit<Pengadaan, 'id' | 'createdAt' | 'updatedAt'>

export type UpdatePengadaanDTO = Partial<Omit<Pengadaan, 'id' | 'createdAt' | 'updatedAt'>>

export interface PengadaanQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  kategori?: string;
  status?: string;
  vendor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedPengadaanResponse {
  data: Pengadaan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PengadaanStats {
  total: number;
  byStatus: Record<string, number>;
  byKategori: Record<string, number>;
  totalNilai: number;
  averageNilai: number;
}