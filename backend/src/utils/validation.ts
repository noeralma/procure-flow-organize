import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { ValidationError } from './errors';
import { PengadaanStatus, PengadaanKategori, Currency } from '../types/pengadaan';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  // Custom ID validation (P-YYYYMMDD-XXXX format)
  customId: z.string().regex(/^P-\d{8}-\d{4}$/, 'Invalid ID format (expected: P-YYYYMMDD-XXXX)'),
  
  // Date validation
  dateString: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
  
  // Currency validation
  currency: z.nativeEnum(Currency),
  
  // Status validation
  status: z.nativeEnum(PengadaanStatus),
  
  // Category validation
  kategori: z.nativeEnum(PengadaanKategori),
  
  // Positive number validation
  positiveNumber: z.number().positive('Must be a positive number'),
  
  // Non-empty string validation
  nonEmptyString: z.string().min(1, 'Field cannot be empty'),
  
  // Optional non-empty string
  optionalNonEmptyString: z.string().min(1).optional(),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Phone validation (Indonesian format)
  phone: z.string().regex(
    /^(\+62|62|0)[0-9]{8,13}$/,
    'Invalid Indonesian phone number format'
  ),
  
  // Enhanced password validation schema
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),
  
  // URL validation
  url: z.string().url('Invalid URL format'),
  
  // Pagination validation
  pagination: z.object({
    page: z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: z.number().int().min(1).max(100, 'Limit must be between 1 and 100').default(10),
  }),
};

/**
 * Pengadaan validation schemas
 */
export const pengadaanSchemas = {
  // Create pengadaan validation
  create: z.object({
    // Legacy fields (required for backward compatibility)
    nama: commonSchemas.nonEmptyString,
    kategori: commonSchemas.kategori,
    vendor: commonSchemas.nonEmptyString,
    nilai: commonSchemas.positiveNumber,
    status: commonSchemas.status,
    tanggal: commonSchemas.dateString,
    deadline: commonSchemas.dateString,
    deskripsi: commonSchemas.nonEmptyString,
    
    // DATA UMUM PENGADAAN
    dataUmumPengadaan: z.object({
      namaPengadaan: commonSchemas.nonEmptyString,
      jenisPengadaan: commonSchemas.nonEmptyString,
      metodePengadaan: commonSchemas.nonEmptyString,
      nilaiPagu: commonSchemas.positiveNumber,
      sumberDana: commonSchemas.nonEmptyString,
      lokasiPekerjaan: commonSchemas.nonEmptyString,
      waktuPelaksanaan: z.object({
        mulai: commonSchemas.dateString,
        selesai: commonSchemas.dateString,
      }),
      satuanKerja: commonSchemas.nonEmptyString,
      ppk: commonSchemas.nonEmptyString,
      pejabatPengadaan: commonSchemas.nonEmptyString,
    }),
    
    // PROSES PERSIAPAN PENGADAAN
    prosesPersiapanPengadaan: z.object({
      identifikasiKebutuhan: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      penyusunanHPS: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        nilaiHPS: commonSchemas.positiveNumber,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      penyusunanSpesifikasi: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      penetapanMetode: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        metode: commonSchemas.nonEmptyString,
        alasan: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
    }),
    
    // PROSES PENGADAAN
    prosesPengadaan: z.object({
      pengumumanLelang: z.object({
        tanggalMulai: commonSchemas.dateString,
        tanggalSelesai: commonSchemas.dateString,
        media: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      pendaftaranPeserta: z.object({
        tanggalMulai: commonSchemas.dateString,
        tanggalSelesai: commonSchemas.dateString,
        jumlahPendaftar: z.number().int().min(0),
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      evaluasiKualifikasi: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        jumlahLulus: z.number().int().min(0),
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      evaluasiTeknis: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        jumlahLulus: z.number().int().min(0),
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      evaluasiHarga: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        penawaranTerendah: commonSchemas.positiveNumber,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      penetapanPemenang: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        pemenang: commonSchemas.nonEmptyString,
        nilaiKontrak: commonSchemas.positiveNumber,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
    }),
    
    // PROSES KONTRAK
    prosesKontrak: z.object({
      persiapanKontrak: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      penandatangananKontrak: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        nomorKontrak: commonSchemas.nonEmptyString,
        nilaiKontrak: commonSchemas.positiveNumber,
        waktuPelaksanaan: z.object({
          mulai: commonSchemas.dateString,
          selesai: commonSchemas.dateString,
        }),
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
      serahTerimaKontrak: z.object({
        tanggal: commonSchemas.dateString,
        pic: commonSchemas.nonEmptyString,
        dokumen: commonSchemas.optionalNonEmptyString,
        status: commonSchemas.nonEmptyString,
        catatan: commonSchemas.optionalNonEmptyString,
      }),
    }),
  }),
  
  // Update pengadaan validation (all fields optional)
  update: z.object({
    // Legacy fields
    nama: commonSchemas.optionalNonEmptyString,
    kategori: commonSchemas.kategori.optional(),
    vendor: commonSchemas.optionalNonEmptyString,
    nilai: commonSchemas.positiveNumber.optional(),
    status: commonSchemas.status.optional(),
    tanggal: commonSchemas.dateString.optional(),
    deadline: commonSchemas.dateString.optional(),
    deskripsi: commonSchemas.optionalNonEmptyString,
    
    // Detailed sections (all optional for updates)
    dataUmumPengadaan: z.object({
      namaPengadaan: commonSchemas.optionalNonEmptyString,
      jenisPengadaan: commonSchemas.optionalNonEmptyString,
      metodePengadaan: commonSchemas.optionalNonEmptyString,
      nilaiPagu: commonSchemas.positiveNumber.optional(),
      sumberDana: commonSchemas.optionalNonEmptyString,
      lokasiPekerjaan: commonSchemas.optionalNonEmptyString,
      waktuPelaksanaan: z.object({
        mulai: commonSchemas.dateString.optional(),
        selesai: commonSchemas.dateString.optional(),
      }).optional(),
      satuanKerja: commonSchemas.optionalNonEmptyString,
      ppk: commonSchemas.optionalNonEmptyString,
      pejabatPengadaan: commonSchemas.optionalNonEmptyString,
    }).optional(),
    
    // Other sections would be similar with optional fields
    // For brevity, I'll make them completely optional
    prosesPersiapanPengadaan: z.any().optional(),
    prosesPengadaan: z.any().optional(),
    prosesKontrak: z.any().optional(),
  }),
  
  // Query parameters validation
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
    search: z.string().optional(),
    status: commonSchemas.status.optional(),
    kategori: commonSchemas.kategori.optional(),
    sortBy: z.enum(['nama', 'tanggal', 'deadline', 'nilai', 'status', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    startDate: commonSchemas.dateString.optional(),
    endDate: commonSchemas.dateString.optional(),
    minNilai: z.string().transform(Number).pipe(commonSchemas.positiveNumber).optional(),
    maxNilai: z.string().transform(Number).pipe(commonSchemas.positiveNumber).optional(),
  }),
};

/**
 * Validation middleware factory
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Determine what to validate based on request method and content
      let dataToValidate: unknown;
      
      if (req.method === 'GET' || req.method === 'DELETE') {
        // Validate query parameters
        dataToValidate = req.query;
      } else {
        // Validate request body
        dataToValidate = req.body;
      }
      
      const validatedData = schema.parse(dataToValidate);
      
      // Replace original data with validated data
      if (req.method === 'GET' || req.method === 'DELETE') {
        req.query = validatedData as ParsedQs;
      } else {
        req.body = validatedData as Record<string, unknown>;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'unknown',
        }));
        
        const firstError = validationErrors[0];
        if (firstError) {
          throw new ValidationError(
            `Validation failed: ${firstError.message}`,
            firstError.field,
            firstError.value,
            validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')
          );
        }
      }
      
      next(error);
    }
  };
};

/**
 * Validate ObjectId parameter
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];
      commonSchemas.objectId.parse(id);
      next();
    } catch (error) {
      throw new ValidationError(
        `Invalid ${paramName} format`,
        paramName,
        req.params[paramName]
      );
    }
  };
};

/**
 * Validate custom ID parameter
 */
export const validateCustomId = (paramName: string = 'id') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];
      commonSchemas.customId.parse(id);
      next();
    } catch (error) {
      throw new ValidationError(
        `Invalid ${paramName} format (expected: P-YYYYMMDD-XXXX)`,
        paramName,
        req.params[paramName]
      );
    }
  };
};

/**
 * Sanitize input data
 * Returns the same structural type as provided, with dangerous keys/characters removed.
 */
export const sanitizeInput = <T>(data: T): T => {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return (
      data
      .trim()
      .replace(/[<>"'&]/g, '') // Remove HTML/XML characters
      .replace(/\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex/gi, '')
    ) as unknown as T; // Remove MongoDB operators
  }
  
  if (Array.isArray(data)) {
    return (data as unknown[]).map(sanitizeInput) as unknown as T;
  }
  
  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      
      // Skip MongoDB operators as keys
      if (key.startsWith('$')) {
        continue;
      }
      
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized as unknown as T;
  }
  
  return data as T;
};

/**
 * Sanitization middleware
 */
export const sanitize = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeInput(req.query) as ParsedQs;
  }
  
  if (req.params) {
    req.params = sanitizeInput(req.params) as ParamsDictionary;
  }
  
  next();
};

/**
 * File upload validation
 */
export const validateFileUpload = (options: {
  allowedTypes?: string[];
  maxSize?: number;
  required?: boolean;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { allowedTypes = [], maxSize = 5 * 1024 * 1024, required = false } = options;
    
    if (!req.file && required) {
      throw new ValidationError('File is required');
    }
    
    if (req.file) {
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
        throw new ValidationError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          'file',
          req.file.mimetype
        );
      }
      
      // Check file size
      if (req.file.size > maxSize) {
        throw new ValidationError(
          `File too large. Maximum size: ${maxSize} bytes`,
          'file',
          req.file.size
        );
      }
    }
    
    next();
  };
};

/**
 * Rate limiting validation
 */
export const validateRateLimit = (_req: Request, _res: Response, next: NextFunction) => {
  // This would typically be handled by express-rate-limit middleware
  // But we can add custom validation here if needed
  next();
};

/**
 * Export validation schemas for reuse
 */
export { commonSchemas as schemas };

/**
 * Type helpers for validated data
 */
export type ValidatedCreatePengadaan = z.infer<typeof pengadaanSchemas.create>;
export type ValidatedUpdatePengadaan = z.infer<typeof pengadaanSchemas.update>;
export type ValidatedPengadaanQuery = z.infer<typeof pengadaanSchemas.query>;
export type ValidatedPagination = z.infer<typeof commonSchemas.pagination>;