import PengadaanModel from '../models/Pengadaan';
import {
  CreatePengadaanDTO,
  UpdatePengadaanDTO,
  PengadaanResponse,
  PengadaanQueryParams,
  PaginatedPengadaanResponse,
  PengadaanStats,
  PengadaanStatus,
} from '../types/pengadaan';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

class PengadaanService {
  /**
   * Create a new pengadaan
   */
  async createPengadaan(data: CreatePengadaanDTO): Promise<PengadaanResponse> {
    try {
      logger.info('Creating new pengadaan', { nama: data.nama });
      
      const pengadaan = new PengadaanModel(data);
      const savedPengadaan = await pengadaan.save();
      
      logger.info('Pengadaan created successfully', { id: savedPengadaan.id });
      return savedPengadaan.toResponse() as PengadaanResponse;
    } catch (error) {
      logger.error('Error creating pengadaan:', error);
      
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new AppError('Validation failed', 400, error.message);
      }
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new AppError('Pengadaan with this ID already exists', 409);
      }
      
      throw new AppError('Failed to create pengadaan', 500);
    }
  }

  /**
   * Get all pengadaan with pagination and filtering
   */
  async getAllPengadaan(params: PengadaanQueryParams): Promise<PaginatedPengadaanResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        kategori,
        status,
        vendor,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        dateFrom,
        dateTo,
      } = params;

      // Build query
      const query: any = {};

      // Text search
      if (search) {
        query.$or = [
          { nama: { $regex: search, $options: 'i' } },
          { deskripsi: { $regex: search, $options: 'i' } },
          { vendor: { $regex: search, $options: 'i' } },
          { namaPaket: { $regex: search, $options: 'i' } },
        ];
      }

      // Filter by kategori
      if (kategori) {
        query.kategori = kategori;
      }

      // Filter by status
      if (status) {
        query.status = status;
      }

      // Filter by vendor
      if (vendor) {
        query.vendor = { $regex: vendor, $options: 'i' };
      }

      // Date range filter
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.createdAt.$lte = new Date(dateTo);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [pengadaanList, total] = await Promise.all([
        PengadaanModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        PengadaanModel.countDocuments(query),
      ]);

      const pages = Math.ceil(total / limit);

      logger.info('Retrieved pengadaan list', {
        total,
        page,
        limit,
        pages,
      });

      return {
        data: pengadaanList.map(item => ({
          ...item,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })) as PengadaanResponse[],
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error retrieving pengadaan list:', error);
      throw new AppError('Failed to retrieve pengadaan list', 500);
    }
  }

  /**
   * Get pengadaan by ID
   */
  async getPengadaanById(id: string): Promise<PengadaanResponse> {
    try {
      logger.info('Retrieving pengadaan by ID', { id });
      
      const pengadaan = await PengadaanModel.findByCustomId(id);
      
      if (!pengadaan) {
        throw new AppError('Pengadaan not found', 404);
      }

      logger.info('Pengadaan retrieved successfully', { id });
      return pengadaan.toResponse() as PengadaanResponse;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error retrieving pengadaan:', error);
      throw new AppError('Failed to retrieve pengadaan', 500);
    }
  }

  /**
   * Update pengadaan by ID
   */
  async updatePengadaan(id: string, data: UpdatePengadaanDTO): Promise<PengadaanResponse> {
    try {
      logger.info('Updating pengadaan', { id });
      
      const pengadaan = await PengadaanModel.findByCustomId(id);
      
      if (!pengadaan) {
        throw new AppError('Pengadaan not found', 404);
      }

      // Update fields
      Object.assign(pengadaan, data);
      const updatedPengadaan = await pengadaan.save();

      logger.info('Pengadaan updated successfully', { id });
      return updatedPengadaan.toResponse() as PengadaanResponse;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'ValidationError') {
        throw new AppError('Validation failed', 400, error.message);
      }
      
      logger.error('Error updating pengadaan:', error);
      throw new AppError('Failed to update pengadaan', 500);
    }
  }

  /**
   * Delete pengadaan by ID
   */
  async deletePengadaan(id: string): Promise<void> {
    try {
      logger.info('Deleting pengadaan', { id });
      
      const result = await PengadaanModel.findOneAndDelete({ id });
      
      if (!result) {
        throw new AppError('Pengadaan not found', 404);
      }

      logger.info('Pengadaan deleted successfully', { id });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error deleting pengadaan:', error);
      throw new AppError('Failed to delete pengadaan', 500);
    }
  }

  /**
   * Search pengadaan by text
   */
  async searchPengadaan(searchTerm: string, limit = 10): Promise<PengadaanResponse[]> {
    try {
      logger.info('Searching pengadaan', { searchTerm, limit });
      
      const pengadaanList = await PengadaanModel.searchByText(searchTerm);
      
      logger.info('Search completed', { resultsCount: pengadaanList.length });
      
      return pengadaanList.slice(0, limit).map((item: any) => ({
        ...item,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })) as PengadaanResponse[];
    } catch (error) {
      logger.error('Error searching pengadaan:', error);
      throw new AppError('Failed to search pengadaan', 500);
    }
  }

  /**
   * Get pengadaan statistics
   */
  async getPengadaanStats(): Promise<PengadaanStats> {
    try {
      logger.info('Calculating pengadaan statistics');
      
      const [total, statusStats, kategoriStats, recentActivity] = await Promise.all([
        PengadaanModel.countDocuments(),
        this.getStatsByField('status'),
        this.getStatsByField('kategori'),
        this.getRecentActivity(),
      ]);

      // Calculate total nilai (simplified - you might want to implement proper currency conversion)
      const nilaiStats = await this.calculateTotalNilai();

      const stats: PengadaanStats = {
        total,
        byStatus: statusStats,
        byKategori: kategoriStats,
        totalNilai: nilaiStats,
        recentActivity,
      };

      logger.info('Statistics calculated successfully', stats);
      return stats;
    } catch (error) {
      logger.error('Error calculating statistics:', error);
      throw new AppError('Failed to calculate statistics', 500);
    }
  }

  /**
   * Get statistics by field
   */
  private async getStatsByField(field: string): Promise<Record<string, number>> {
    const pipeline = [
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 as const },
      },
    ];

    const results = await PengadaanModel.aggregate(pipeline);
    
    return results.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  /**
   * Calculate total nilai
   */
  private async calculateTotalNilai(): Promise<{ idr: number; usd: number }> {
    // This is a simplified calculation
    // In a real application, you'd want to properly parse and convert currencies
    const pengadaanList = await PengadaanModel.find({}, 'nilaiHpsCurrency nilaiHpsAmount').lean();
    
    let totalIdr = 0;
    let totalUsd = 0;

    pengadaanList.forEach(item => {
      const amount = parseFloat(item.nilaiHpsAmount?.replace(/[^0-9.-]+/g, '') || '0');
      
      if (item.nilaiHpsCurrency === 'IDR') {
        totalIdr += amount;
      } else if (item.nilaiHpsCurrency === 'USD') {
        totalUsd += amount;
      }
    });

    return { idr: totalIdr, usd: totalUsd };
  }

  /**
   * Get recent activity statistics
   */
  private async getRecentActivity(): Promise<{ created: number; updated: number; completed: number }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [created, updated, completed] = await Promise.all([
      PengadaanModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      PengadaanModel.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
      PengadaanModel.countDocuments({
        status: PengadaanStatus.COMPLETED,
        updatedAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    return { created, updated, completed };
  }

  /**
   * Bulk operations
   */
  async bulkUpdateStatus(ids: string[], status: PengadaanStatus): Promise<number> {
    try {
      logger.info('Bulk updating status', { ids, status });
      
      const result = await PengadaanModel.updateMany(
        { id: { $in: ids } },
        { status, updatedAt: new Date() }
      );

      logger.info('Bulk update completed', { modifiedCount: result.modifiedCount });
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error in bulk update:', error);
      throw new AppError('Failed to bulk update status', 500);
    }
  }

  /**
   * Export pengadaan data
   */
  async exportPengadaan(format: 'json' | 'csv' = 'json'): Promise<any> {
    try {
      logger.info('Exporting pengadaan data', { format });
      
      const pengadaanList = await PengadaanModel.find({}).lean();
      
      if (format === 'json') {
        return pengadaanList;
      }
      
      // For CSV format, you might want to implement CSV conversion
      // This is a placeholder for CSV export functionality
      throw new AppError('CSV export not implemented yet', 501);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error exporting data:', error);
      throw new AppError('Failed to export data', 500);
    }
  }
}

export default new PengadaanService();