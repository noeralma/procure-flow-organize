import { Document, Model, Types } from 'mongoose';

/**
 * Base Pengadaan interface matching the frontend structure
 */
export interface IPengadaan {
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

/**
 * Pengadaan document interface with Mongoose document methods
 */
export interface IPengadaanDocument extends IPengadaan, Document {
  id: string;
  createdBy: Types.ObjectId; // ObjectId reference
  lastModifiedBy?: Types.ObjectId; // ObjectId reference
  isEditable: boolean;
  editHistory: Array<{
    userId: Types.ObjectId; // ObjectId reference
    action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected';
    timestamp: Date;
    changes?: Record<string, unknown>;
    reason?: string;
  }>;
  submittedAt?: Date;
  submittedBy?: Types.ObjectId; // ObjectId reference
  createdAt: Date;
  updatedAt: Date;
  toResponse(): PengadaanResponse;
  addEditHistory(userId: string, action: string, changes?: Record<string, unknown>, reason?: string): void;
  canUserEdit(userId: string, userRole: string): boolean;
  submitForm(userId: string): void;
  approveForm(userId: string, reason?: string): void;
  rejectForm(userId: string, reason: string): void;
}

/**
 * Pengadaan model interface with static methods
 */
export interface IPengadaanModel extends Model<IPengadaanDocument> {
  findByCustomId(customId: string): Promise<IPengadaanDocument | null>;
  searchByText(searchTerm: string): Promise<IPengadaanDocument[]>;
  findByUser(userId: string, options?: Record<string, unknown>): Promise<IPengadaanDocument[]>;
  findSubmitted(options?: Record<string, unknown>): Promise<IPengadaanDocument[]>;
}

/**
 * Create Pengadaan DTO (Data Transfer Object)
 */
export type CreatePengadaanDTO = Omit<IPengadaan, 'id'>;

/**
 * Update Pengadaan DTO
 */
export type UpdatePengadaanDTO = Partial<IPengadaan>;

/**
 * Pengadaan response interface
 */
export interface PengadaanResponse {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  vendor: string;
  nilai: string;
  status: string;
  tanggal: string;
  deadline: string;
  sinergi: string;
  namaPaket: string;
  lapPtm: string;
  sla?: string;
  tahunSla?: string;
  costSaving?: string;
  tahunCostSaving?: string;
  barangJasa: string;
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
  suratPenunjukan: string;
  lamaProsesPengadaan: string;
  jangkaWaktuPengerjaan?: string;
  nilaiPenunjukanCurrency: string;
  nilaiPenunjukanAmount: string;
  nilaiPenunjukanEqRupiah: string;
  statusPengadaan: string;
  bulanSelesai: string;
  keteranganPengadaan?: string;
  costSavingRp?: string;
  nilaiKontrakRupiah?: string;
  nilaiKontrakUsd?: string;
  nilaiKontrakPortiTahun?: string;
  penyediaBarangJasa: string;
  statusPenyedia: string;
  kontrakNomor: string;
  kontrakTanggal: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for filtering pengadaan
 */
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

/**
 * Paginated response interface
 */
export interface PaginatedPengadaanResponse {
  data: PengadaanResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Pengadaan statistics interface
 */
export interface PengadaanStats {
  total: number;
  byStatus: Record<string, number>;
  byKategori: Record<string, number>;
  totalNilai: {
    idr: number;
    usd: number;
  };
  recentActivity: {
    created: number;
    updated: number;
    completed: number;
  };
}

/**
 * Enum for pengadaan status
 */
export enum PengadaanStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  IN_REVIEW = 'In Review',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

/**
 * Enum for pengadaan categories
 */
export enum PengadaanKategori {
  BARANG = 'Barang',
  JASA = 'Jasa',
  KONSTRUKSI = 'Konstruksi',
  KONSULTANSI = 'Konsultansi',
}

/**
 * Enum for currency types
 */
export enum Currency {
  IDR = 'IDR',
  USD = 'USD',
  EUR = 'EUR',
  SGD = 'SGD',
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}