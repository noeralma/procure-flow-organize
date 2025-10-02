import mongoose, { Schema } from 'mongoose';
import { IPengadaanDocument, IPengadaanModel, PengadaanStatus, PengadaanKategori, Currency } from '../types/pengadaan';

// Custom ID generator for Pengadaan
const generatePengadaanId = async (): Promise<string> => {
  const count = await PengadaanModel.countDocuments();
  return `PGD-${String(count + 1).padStart(3, '0')}`;
};

// Pengadaan Schema
const pengadaanSchema = new Schema<IPengadaanDocument>(
  {
    // Custom ID field
    id: {
      type: String,
      required: true,
    },
    
    // User ownership and permissions tracking
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    editHistory: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      action: {
        type: String,
        enum: ['created', 'updated', 'submitted', 'approved', 'rejected'],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      changes: {
        type: Schema.Types.Mixed,
      },
      reason: {
        type: String,
        trim: true,
      },
    }],
    submittedAt: {
      type: Date,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Legacy fields for backward compatibility
    nama: {
      type: String,
      required: [true, 'Nama pengadaan is required'],
      trim: true,
      maxlength: [200, 'Nama pengadaan cannot exceed 200 characters'],
    },
    kategori: {
      type: String,
      required: [true, 'Kategori is required'],
      enum: {
        values: Object.values(PengadaanKategori),
        message: 'Invalid kategori value',
      },
    },
    deskripsi: {
      type: String,
      required: [true, 'Deskripsi is required'],
      trim: true,
      maxlength: [1000, 'Deskripsi cannot exceed 1000 characters'],
    },
    vendor: {
      type: String,
      required: [true, 'Vendor is required'],
      trim: true,
      maxlength: [200, 'Vendor name cannot exceed 200 characters'],
    },
    nilai: {
      type: String,
      required: [true, 'Nilai is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: Object.values(PengadaanStatus),
        message: 'Invalid status value',
      },
      default: PengadaanStatus.DRAFT,
    },
    tanggal: {
      type: String,
      required: [true, 'Tanggal is required'],
    },
    deadline: {
      type: String,
      required: [true, 'Deadline is required'],
    },
    
    // Section 1: DATA UMUM PENGADAAN
    sinergi: {
      type: String,
      required: [true, 'Sinergi is required'],
      trim: true,
    },
    namaPaket: {
      type: String,
      required: [true, 'Nama paket is required'],
      trim: true,
      maxlength: [300, 'Nama paket cannot exceed 300 characters'],
    },
    lapPtm: {
      type: String,
      required: [true, 'LAP PTM is required'],
      trim: true,
    },
    sla: {
      type: String,
      trim: true,
    },
    tahunSla: {
      type: String,
      trim: true,
    },
    costSaving: {
      type: String,
      trim: true,
    },
    tahunCostSaving: {
      type: String,
      trim: true,
    },
    barangJasa: {
      type: String,
      required: [true, 'Barang/Jasa is required'],
      trim: true,
    },

    // Section 2: PROSES PERSIAPAN PENGADAAN
    penggunaBarangJasa: {
      type: String,
      required: [true, 'Pengguna barang/jasa is required'],
      trim: true,
    },
    jenisPaket: {
      type: String,
      required: [true, 'Jenis paket is required'],
      trim: true,
    },
    jenisPengadaan: {
      type: String,
      required: [true, 'Jenis pengadaan is required'],
      trim: true,
    },
    baseline: {
      type: String,
      required: [true, 'Baseline is required'],
      trim: true,
    },
    noPpl: {
      type: String,
      required: [true, 'No PPL is required'],
      trim: true,
    },
    metodePengadaan: {
      type: String,
      required: [true, 'Metode pengadaan is required'],
      trim: true,
    },
    tahunAnggaran: {
      type: String,
      required: [true, 'Tahun anggaran is required'],
      trim: true,
    },
    jenisAnggaran: {
      type: String,
      required: [true, 'Jenis anggaran is required'],
      trim: true,
    },
    jenisKontrak: {
      type: String,
      required: [true, 'Jenis kontrak is required'],
      trim: true,
    },
    nilaiAnggaranIdr: {
      type: String,
      trim: true,
    },
    nilaiAnggaranUsd: {
      type: String,
      trim: true,
    },
    nilaiHpsCurrency: {
      type: String,
      required: [true, 'Nilai HPS currency is required'],
      enum: {
        values: Object.values(Currency),
        message: 'Invalid currency value',
      },
    },
    nilaiHpsAmount: {
      type: String,
      required: [true, 'Nilai HPS amount is required'],
      trim: true,
    },
    nilaiHpsEqRupiah: {
      type: String,
      required: [true, 'Nilai HPS equivalent rupiah is required'],
      trim: true,
    },
    nilaiHpsPortiTahun: {
      type: String,
      required: [true, 'Nilai HPS porsi tahun is required'],
      trim: true,
    },
    bulanPermintaan: {
      type: String,
      required: [true, 'Bulan permintaan is required'],
      trim: true,
    },
    tanggalPermintaan: {
      type: String,
      required: [true, 'Tanggal permintaan is required'],
    },
    tanggalPermintaanDiterima: {
      type: String,
      required: [true, 'Tanggal permintaan diterima is required'],
    },
    tanggalRapatPersiapan: {
      type: String,
      required: [true, 'Tanggal rapat persiapan is required'],
    },
    tanggalRevisiPermintaan: {
      type: String,
    },
    lamaRevisiPermintaan: {
      type: String,
      trim: true,
    },
    noPurchaseRequisition: {
      type: String,
      required: [true, 'No Purchase Requisition is required'],
      trim: true,
    },
    tanggalPurchaseRequisition: {
      type: String,
      required: [true, 'Tanggal Purchase Requisition is required'],
    },
    jenisMySap: {
      type: String,
      required: [true, 'Jenis MySAP is required'],
      trim: true,
    },
    tanggalPerintahPengadaan: {
      type: String,
      required: [true, 'Tanggal perintah pengadaan is required'],
    },
    lamaProsesPersiapan: {
      type: String,
      required: [true, 'Lama proses persiapan is required'],
      trim: true,
    },
    kategoriRisiko: {
      type: String,
      required: [true, 'Kategori risiko is required'],
      trim: true,
    },
    keteranganPersiapan: {
      type: String,
      trim: true,
      maxlength: [500, 'Keterangan persiapan cannot exceed 500 characters'],
    },
    picTimPpsm: {
      type: String,
      required: [true, 'PIC Tim PPSM is required'],
      trim: true,
    },

    // Section 3: PROSES PENGADAAN
    suratPenunjukan: {
      type: String,
      required: [true, 'Surat penunjukan is required'],
      trim: true,
    },
    lamaProsesPengadaan: {
      type: String,
      required: [true, 'Lama proses pengadaan is required'],
      trim: true,
    },
    jangkaWaktuPengerjaan: {
      type: String,
      trim: true,
    },
    nilaiPenunjukanCurrency: {
      type: String,
      required: [true, 'Nilai penunjukan currency is required'],
      enum: {
        values: Object.values(Currency),
        message: 'Invalid currency value',
      },
    },
    nilaiPenunjukanAmount: {
      type: String,
      required: [true, 'Nilai penunjukan amount is required'],
      trim: true,
    },
    nilaiPenunjukanEqRupiah: {
      type: String,
      required: [true, 'Nilai penunjukan equivalent rupiah is required'],
      trim: true,
    },
    statusPengadaan: {
      type: String,
      required: [true, 'Status pengadaan is required'],
      trim: true,
    },
    bulanSelesai: {
      type: String,
      required: [true, 'Bulan selesai is required'],
      trim: true,
    },
    keteranganPengadaan: {
      type: String,
      trim: true,
      maxlength: [500, 'Keterangan pengadaan cannot exceed 500 characters'],
    },

    // Section 4: PROSES KONTRAK
    costSavingRp: {
      type: String,
      trim: true,
    },
    nilaiKontrakRupiah: {
      type: String,
      trim: true,
    },
    nilaiKontrakUsd: {
      type: String,
      trim: true,
    },
    nilaiKontrakPortiTahun: {
      type: String,
      trim: true,
    },
    penyediaBarangJasa: {
      type: String,
      required: [true, 'Penyedia barang/jasa is required'],
      trim: true,
    },
    statusPenyedia: {
      type: String,
      required: [true, 'Status penyedia is required'],
      trim: true,
    },
    kontrakNomor: {
      type: String,
      required: [true, 'Nomor kontrak is required'],
      trim: true,
    },
    kontrakTanggal: {
      type: String,
      required: [true, 'Tanggal kontrak is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
pengadaanSchema.index({ id: 1 }, { unique: true });
pengadaanSchema.index({ nama: 'text', deskripsi: 'text', vendor: 'text' });
pengadaanSchema.index({ kategori: 1 });
pengadaanSchema.index({ status: 1 });
pengadaanSchema.index({ vendor: 1 });
pengadaanSchema.index({ tanggal: 1 });
pengadaanSchema.index({ deadline: 1 });
pengadaanSchema.index({ createdAt: -1 });
pengadaanSchema.index({ updatedAt: -1 });
// New indexes for user ownership and permissions
pengadaanSchema.index({ createdBy: 1 });
pengadaanSchema.index({ lastModifiedBy: 1 });
pengadaanSchema.index({ isEditable: 1 });
pengadaanSchema.index({ submittedAt: 1 });
pengadaanSchema.index({ submittedBy: 1 });

// Pre-save middleware to generate custom ID
pengadaanSchema.pre('save', async function (next) {
  if (this.isNew && !this.id) {
    this.id = await generatePengadaanId();
  }
  next();
});

// Instance methods
pengadaanSchema.methods['toResponse'] = function (): object {
  const obj = this['toObject']();
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Method to add edit history entry
pengadaanSchema.methods['addEditHistory'] = function (userId: string, action: string, changes?: any, reason?: string) {
  this['editHistory'].push({
    userId,
    action,
    timestamp: new Date(),
    changes,
    reason,
  });
  this['lastModifiedBy'] = userId;
};

// Method to check if user can edit
pengadaanSchema.methods['canUserEdit'] = function (userId: string, userRole: string): boolean {
  // Admin can always edit
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // If form is not editable, only admin can edit
  if (!this['isEditable']) {
    return false;
  }
  
  // User can edit their own forms if not submitted
  if (this['createdBy'].toString() === userId && !this['submittedAt']) {
    return true;
  }
  
  return false;
};

// Method to submit form
pengadaanSchema.methods['submitForm'] = function (userId: string) {
  this['submittedAt'] = new Date();
  this['submittedBy'] = userId;
  this['isEditable'] = false;
  this['addEditHistory'](userId, 'submitted');
};

// Method to approve form (admin only)
pengadaanSchema.methods['approveForm'] = function (userId: string, reason?: string) {
  this['addEditHistory'](userId, 'approved', null, reason);
};

// Method to reject form (admin only)
pengadaanSchema.methods['rejectForm'] = function (userId: string, reason: string) {
  this['isEditable'] = true;
  this['addEditHistory'](userId, 'rejected', null, reason);
};

// Static methods
pengadaanSchema.statics['findByCustomId'] = function (customId: string) {
  return this.findOne({ id: customId });
};

pengadaanSchema.statics['searchByText'] = function (searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  });
};

// Static method to find by user
pengadaanSchema.statics['findByUser'] = function (userId: string, options: any = {}) {
  const query = { createdBy: userId };
  return this.find(query, null, options).populate('createdBy lastModifiedBy submittedBy', 'firstName lastName email');
};

// Static method to find submitted forms
pengadaanSchema.statics['findSubmitted'] = function (options: any = {}) {
  const query = { submittedAt: { $exists: true } };
  return this.find(query, null, options).populate('createdBy lastModifiedBy submittedBy', 'firstName lastName email');
};

// Create and export the model
const PengadaanModel: IPengadaanModel = mongoose.model<IPengadaanDocument, IPengadaanModel>(
  'Pengadaan',
  pengadaanSchema
);

export default PengadaanModel;
export { generatePengadaanId };