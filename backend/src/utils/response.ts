import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface ApiSuccess<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  requestId?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
  details?: unknown;
  requestId?: string;
}

export const getRequestId = (req: Request): string => {
  const headerId = (req.headers['x-request-id'] as string) || '';
  if (headerId) return headerId;
  // Attach and return a generated id for traceability
  const id = uuidv4();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any)._requestId = id;
  return id;
};

// Overloads to support legacy signature with statusCode and meta
export function sendSuccess<T = unknown>(
  res: Response,
  data?: T,
  message?: string,
  requestId?: string
): void;
export function sendSuccess<T = unknown>(
  res: Response,
  data: T | undefined,
  message: string | undefined,
  statusCode: number,
  meta?: unknown,
  requestId?: string
): void;
export function sendSuccess<T = unknown>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusOrRequestId?: number | string,
  _meta?: unknown,
  maybeRequestId?: string
): void {
  const payload: ApiSuccess<T> = {
    success: true,
    message,
  };
  if (data !== undefined) payload.data = data;
  let statusCode = 200;
  let requestId: string | undefined = undefined;
  if (typeof statusOrRequestId === 'number') {
    statusCode = statusOrRequestId;
    requestId = maybeRequestId;
  } else if (typeof statusOrRequestId === 'string') {
    requestId = statusOrRequestId;
  }
  if (requestId !== undefined) payload.requestId = requestId;
  res.status(statusCode).json(payload);
}

export const sendCreated = <T = unknown>(
  res: Response,
  data?: T,
  message = 'Created',
  requestId?: string
): void => {
  const payload: ApiSuccess<T> = {
    success: true,
    message,
  };
  if (data !== undefined) payload.data = data;
  if (requestId !== undefined) payload.requestId = requestId;
  res.status(201).json(payload);
};

export const sendNoContent = (
  res: Response,
  message = 'No Content',
  requestId?: string
): void => {
  const payload: ApiSuccess = {
    success: true,
    message,
  };
  if (requestId !== undefined) payload.requestId = requestId;
  res.status(204).json(payload);
};

// Overload to support both legacy signature (page, limit, total) and object form
export function sendPaginated<T = unknown>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number,
  message?: string,
  requestId?: string
): void;
export function sendPaginated<T = unknown>(
  res: Response,
  items: T[],
  pagination: { page: number; limit: number; total: number; totalPages?: number },
  message?: string,
  requestId?: string
): void;
export function sendPaginated<T = unknown>(
  res: Response,
  items: T[],
  paginationOrPage: number | { page: number; limit: number; total: number; totalPages?: number },
  limitOrMessage?: number | string,
  totalOrRequestId?: number | string,
  message?: string,
  requestId?: string
): void {
  let pagination: { page: number; limit: number; total: number; totalPages: number };
  let finalMessage = message ?? 'Success';
  let finalRequestId = requestId;

  if (typeof paginationOrPage === 'number') {
    const page = paginationOrPage;
    const limit = (limitOrMessage as number) ?? 10;
    const total = (totalOrRequestId as number) ?? 0;
    // Compute totalPages safely
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    pagination = { page, limit, total, totalPages };
  } else {
    const p = paginationOrPage;
    const totalPages = p.totalPages ?? (p.limit > 0 ? Math.ceil(p.total / p.limit) : 0);
    pagination = { page: p.page, limit: p.limit, total: p.total, totalPages };
    // Adjust optional args when using object form
    if (typeof limitOrMessage === 'string') finalMessage = limitOrMessage;
    if (typeof totalOrRequestId === 'string') finalRequestId = totalOrRequestId;
  }

  const payload: ApiSuccess<T[]> = {
    success: true,
    data: items,
    message: finalMessage,
    pagination,
  };
  if (finalRequestId !== undefined) payload.requestId = finalRequestId;
  res.status(200).json(payload);
}

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown,
  requestId?: string
): void => {
  const payload: ApiError = {
    success: false,
    message,
    statusCode,
    details,
  };
  if (requestId !== undefined) payload.requestId = requestId;
  res.status(statusCode).json(payload);
};

export const sendNotFound = (
  res: Response,
  message = 'Not Found',
  requestId?: string
): void => {
  const payload: ApiError = {
    success: false,
    message,
    statusCode: 404,
  };
  if (requestId !== undefined) payload.requestId = requestId;
  res.status(404).json(payload);
};