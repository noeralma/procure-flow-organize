import { Request, Response, NextFunction } from 'express';
import pengadaanService from '../services/pengadaanService';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  getRequestId,
} from '../utils/response';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import {
  ValidatedCreatePengadaan,
  ValidatedUpdatePengadaan,
} from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Extended request interface for pengadaan operations
 */
interface PengadaanRequest extends AuthenticatedRequest {
  body: ValidatedCreatePengadaan | ValidatedUpdatePengadaan;
  query: any; // Use any to avoid strict typing issues with Express query
}

/**
 * Get all pengadaan with pagination, filtering, and search
 */
export const getAllPengadaan = async (
  req: PengadaanRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const {
      page = 1,
      limit = 10,
      search,
      status,
      kategori,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = req.query;

    logger.debug('Getting all pengadaan', {
      requestId,
      query: req.query,
      userId: req.user?.id,
    });

    const result = await pengadaanService.getAllPengadaan({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      kategori,
      sortBy,
      sortOrder,
      dateFrom: startDate,
      dateTo: endDate,
    });

    sendPaginated(
      res,
      result.data,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      'Pengadaan data retrieved successfully',
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get pengadaan by ID
 */
export const getPengadaanById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const id = req.params['id'] as string;

    if (!id) {
      throw new ValidationError('ID is required');
    }

    if (!id) {
      throw new ValidationError('ID is required');
    }

    logger.debug('Getting pengadaan by ID', {
      requestId,
      pengadaanId: id,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    const pengadaan = await pengadaanService.getPengadaanById(id);

    if (!pengadaan) {
      throw new NotFoundError('Pengadaan');
    }

    sendSuccess(
      res,
      pengadaan,
      'Pengadaan retrieved successfully',
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create new pengadaan
 */
export const createPengadaan = async (
  req: PengadaanRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const pengadaanData = req.body as ValidatedCreatePengadaan;

    logger.debug('Creating new pengadaan', {
      requestId,
      nama: pengadaanData.nama,
      kategori: pengadaanData.kategori,
      nilai: pengadaanData.nilai,
      userId: req.user?.id,
    });

    const newPengadaan = await pengadaanService.createPengadaan(pengadaanData as any);

    logger.info('Pengadaan created successfully', {
      requestId,
      pengadaanId: newPengadaan.id,
      nama: newPengadaan.nama,
      userId: req.user?.id,
    });

    sendCreated(
      res,
      newPengadaan,
      'Pengadaan created successfully',
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update pengadaan by ID
 */
export const updatePengadaan = async (
  req: PengadaanRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const id = req.params['id'] as string;

    if (!id) {
      throw new ValidationError('ID is required');
    }
    const updateData = req.body as ValidatedUpdatePengadaan;

    logger.debug('Updating pengadaan', {
      requestId,
      pengadaanId: id,
      updateFields: Object.keys(updateData),
      userId: req.user?.id,
    });

    const updatedPengadaan = await pengadaanService.updatePengadaan(id, updateData as any);

    if (!updatedPengadaan) {
      throw new NotFoundError('Pengadaan');
    }

    logger.info('Pengadaan updated successfully', {
      requestId,
      pengadaanId: id,
      nama: updatedPengadaan.nama,
      userId: req.user?.id,
    });

    sendSuccess(
      res,
      updatedPengadaan,
      'Pengadaan updated successfully',
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete pengadaan by ID
 */
export const deletePengadaan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const id = req.params['id'] as string;

    if (!id) {
      throw new ValidationError('ID is required');
    }

    logger.debug('Deleting pengadaan', {
      requestId,
      pengadaanId: id,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    await pengadaanService.deletePengadaan(id);

    logger.info('Pengadaan deleted successfully', {
      requestId,
      pengadaanId: id,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    sendNoContent(res, 'Pengadaan deleted successfully', requestId);
  } catch (error) {
    next(error);
  }
};

/**
 * Get pengadaan statistics
 */
export const getPengadaanStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);

    logger.debug('Getting pengadaan statistics', {
      requestId,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    const stats = await pengadaanService.getPengadaanStats();

    sendSuccess(
      res,
      stats,
      'Pengadaan statistics retrieved successfully',
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Search pengadaan
 */
export const searchPengadaan = async (
  req: PengadaanRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { q: query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required', 'q', query);
    }

    logger.debug('Searching pengadaan', {
      requestId,
      query,
      limit,
      userId: req.user?.id,
    });

    const results = await pengadaanService.searchPengadaan(query, Number(limit));

    sendSuccess(
      res,
      results,
      'Search completed successfully',
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create pengadaan
 */
export const bulkCreatePengadaan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { pengadaanList } = req.body;

    if (!Array.isArray(pengadaanList) || pengadaanList.length === 0) {
      throw new ValidationError(
        'pengadaanList must be a non-empty array',
        'pengadaanList',
        pengadaanList
      );
    }

    logger.debug('Bulk creating pengadaan', {
      requestId,
      count: pengadaanList.length,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    // Since bulkCreatePengadaan doesn't exist in service, we'll create individually
    const results = {
      success: [] as any[],
      errors: [] as { data: any; error: string }[]
    };

    for (const pengadaanData of pengadaanList) {
      try {
        const created = await pengadaanService.createPengadaan(pengadaanData);
        results.success.push(created);
      } catch (error) {
        results.errors.push({
          data: pengadaanData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Bulk pengadaan creation completed', {
      requestId,
      totalRequested: pengadaanList.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    sendCreated(
      res,
      results,
      `Bulk operation completed: ${results.success.length} created, ${results.errors.length} failed`,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update pengadaan
 */
export const bulkUpdatePengadaan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError(
        'updates must be a non-empty array',
        'updates',
        updates
      );
    }

    logger.debug('Bulk updating pengadaan', {
      requestId,
      count: updates.length,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    // Since bulkUpdatePengadaan doesn't exist in service, we'll update individually
    const results = {
      success: [] as any[],
      errors: [] as { id: string; error: string }[]
    };

    for (const update of updates) {
      try {
        const updated = await pengadaanService.updatePengadaan(update.id, update.data);
        results.success.push(updated);
      } catch (error) {
        results.errors.push({
          id: update.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Bulk pengadaan update completed', {
      requestId,
      totalRequested: updates.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    sendSuccess(
      res,
      results,
      `Bulk update completed: ${results.success.length} updated, ${results.errors.length} failed`,
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk delete pengadaan
 */
export const bulkDeletePengadaan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError(
        'ids must be a non-empty array',
        'ids',
        ids
      );
    }

    logger.debug('Bulk deleting pengadaan', {
      requestId,
      count: ids.length,
      ids,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    // Since bulkDeletePengadaan doesn't exist in service, we'll delete individually
    const results = {
      success: [] as string[],
      errors: [] as { id: string; error: string }[]
    };

    for (const id of ids) {
      try {
        await pengadaanService.deletePengadaan(id);
        results.success.push(id);
      } catch (error) {
        results.errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Bulk pengadaan deletion completed', {
      requestId,
      totalRequested: ids.length,
      successCount: results.success.length,
      errorCount: results.errors.length,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    sendSuccess(
      res,
      results,
      `Bulk delete completed: ${results.success.length} deleted, ${results.errors.length} failed`,
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Export pengadaan data
 */
export const exportPengadaan = async (
  req: PengadaanRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { format = 'json', ...filters } = req.query;

    logger.debug('Exporting pengadaan data', {
      requestId,
      format,
      filters,
      userId: req.user?.id,
    });

    // Get all data without pagination for export
    const result = await pengadaanService.getAllPengadaan({
      ...filters,
      page: 1,
      limit: 10000, // Large limit for export
    });

    const filename = `pengadaan_export_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        // TODO: Implement CSV conversion
        res.send('CSV export not implemented yet');
        break;

      case 'excel':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        // TODO: Implement Excel conversion
        res.send('Excel export not implemented yet');
        break;

      case 'json':
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        sendSuccess(
          res,
          result.data,
          'Data exported successfully',
          200,
          undefined,
          requestId
        );
        break;
    }

    logger.info('Pengadaan data exported', {
      requestId,
      format,
      recordCount: result.data.length,
      userId: req.user?.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pengadaan by custom ID (P-YYYYMMDD-XXXX format)
 */
export const getPengadaanByCustomId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { customId } = req.params;

    if (!customId) {
      throw new ValidationError('Custom ID is required');
    }

    logger.debug('Getting pengadaan by custom ID', {
      requestId,
      customId,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    const pengadaan = await pengadaanService.getPengadaanById(customId);

    if (!pengadaan) {
      throw new NotFoundError('Pengadaan');
    }

    sendSuccess(
      res,
      pengadaan,
      'Pengadaan retrieved successfully',
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent pengadaan activity
 */
export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestId = getRequestId(req);
    const { limit = 10 } = req.query;

    logger.debug('Getting recent pengadaan activity', {
      requestId,
      limit,
      userId: (req as AuthenticatedRequest).user?.id,
    });

    // Since getRecentActivity is private, we'll use getPengadaanStats instead
    const stats = await pengadaanService.getPengadaanStats();
    const recentActivity = {
      recent: stats.recentActivity || { created: 0, updated: 0, completed: 0 },
      limit: Number(limit)
    };

    sendSuccess(
      res,
      recentActivity,
      'Recent activity retrieved successfully',
      200,
      undefined,
      requestId
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getAllPengadaan,
  getPengadaanById,
  createPengadaan,
  updatePengadaan,
  deletePengadaan,
  getPengadaanStats,
  searchPengadaan,
  bulkCreatePengadaan,
  bulkUpdatePengadaan,
  bulkDeletePengadaan,
  exportPengadaan,
  getPengadaanByCustomId,
  getRecentActivity,
};