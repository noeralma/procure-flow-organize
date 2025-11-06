import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError, getRequestId } from './response';

type Location = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, location: Location = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req[location as keyof Request] as unknown;
    const result = schema.safeParse(value);
    if (!result.success) {
      const requestId = getRequestId(req);
      const details = result.error.flatten();
      sendError(_res as Response, 'Validation error', 400, details, requestId);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any)[location] = result.data;
    next();
  };
};

// Sanitization utility to strip MongoDB operators from inputs
// Preserve the input type for better TypeScript ergonomics in callers/tests
export const sanitizeInput = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return (input.map((item) => sanitizeInput(item)) as unknown) as T;
  }
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue; // strip MongoDB operators
      sanitized[key] = sanitizeInput(value as unknown);
    }
    return sanitized as unknown as T;
  }
  return input;
};

// Middleware factories for param validation used in routes
export const validateObjectId = (paramKey: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramKey];
    const requestId = getRequestId(req);
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      sendError(res, `Invalid ObjectId for param '${paramKey}'`, 400, undefined, requestId);
      return;
    }
    next();
  };
};

export const validateCustomId = (paramKey: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramKey];
    const requestId = getRequestId(req);
    if (!id || !/^[A-Z0-9_-]{6,32}$/.test(id)) {
      sendError(res, `Invalid custom ID for param '${paramKey}'`, 400, undefined, requestId);
      return;
    }
    next();
  };
};

export const commonSchemas = {
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .refine((val) => /[A-Z]/.test(val), 'Password must contain an uppercase letter')
    .refine((val) => /[a-z]/.test(val), 'Password must contain a lowercase letter')
    .refine((val) => /\d/.test(val), 'Password must contain a number')
    .refine((val) => /[@$!%*?&]/.test(val), 'Password must contain a special character (@$!%*?&)'),
  nonEmptyString: z.string().min(1),
  objectId: z.string().regex(/^[a-fA-F0-9]{24}$/),
};

export const pengadaanSchemas = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: z.string().optional(),
    kategori: z.string().optional(),
    sortBy: z.enum(['nama', 'vendor', 'nilai', 'status']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    minNilai: z.coerce.number().optional(),
    maxNilai: z.coerce.number().optional(),
  }),
  paramsId: z.object({
    id: commonSchemas.objectId,
  }),
  create: z.object({
    nama: z.string().min(3),
    vendor: z.string().min(2),
    nilai: z.union([z.coerce.number(), z.string()]),
    kategori: z.string().optional(),
    status: z.string().optional(),
    tanggal: z.string().optional(),
    deadline: z.string().optional(),
  }),
  update: z.object({
    nama: z.string().min(3).optional(),
    vendor: z.string().min(2).optional(),
    nilai: z.union([z.coerce.number(), z.string()]).optional(),
    kategori: z.string().optional(),
    status: z.string().optional(),
    deskripsi: z.string().optional(),
    tanggal: z.string().optional(),
    deadline: z.string().optional(),
  }),
};

export type ValidatedCreatePengadaan = z.infer<typeof pengadaanSchemas.create>;
export type ValidatedUpdatePengadaan = z.infer<typeof pengadaanSchemas.update>;