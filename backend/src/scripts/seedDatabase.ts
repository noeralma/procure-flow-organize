import { connectDatabase, disconnectDatabase } from '../config/database';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import Pengadaan from '../models/Pengadaan';
import { PengadaanStatus, PengadaanKategori, Currency } from '../types/pengadaan';

/**
 * Database seeding script
 * This script populates the database with sample data for development and testing
 */

/**
 * Sample pengadaan data for seeding
 */
const samplePengadaanData = [
  {
    // Legacy fields
    namaPengadaan: 'Pengadaan Laptop untuk Kantor Pusat',
    nilaiPengadaan: 500000000,
    tanggalPengadaan: new Date('2024-01-15'),
    status: PengadaanStatus.IN_PROGRESS,
    kategori: PengadaanKategori.BARANG,
    deskripsi: 'Pengadaan 50 unit laptop untuk kebutuhan operasional kantor pusat',
    
    // Detailed sections
    dataUmumPengadaan: {
      kodePengadaan: 'PGD-2024-001',
      namaPaket: 'Pengadaan Laptop Kantor Pusat 2024',
      jenisKontrak: 'Pengadaan Barang',
      metodePengadaan: 'Tender Terbuka',
      nilaiTotal: {
        amount: 500000000,
        currency: Currency.IDR,
      },
      sumberDana: 'APBN',
      tahunAnggaran: 2024,
      lokasiPekerjaan: 'Jakarta Pusat',
      waktuPelaksanaan: {
        mulai: new Date('2024-02-01'),
        selesai: new Date('2024-03-31'),
        durasi: 60,
        satuan: 'hari',
      },
    },
    
    prosesPersiapanPengadaan: {
      identifikasiKebutuhan: {
        tanggal: new Date('2023-12-01'),
        dokumen: 'Analisis Kebutuhan IT 2024',
        pic: 'Bagian IT',
      },
      studiKelayakan: {
        tanggal: new Date('2023-12-15'),
        hasil: 'Layak',
        dokumen: 'Studi Kelayakan Pengadaan Laptop',
      },
      penyusunanHPS: {
        tanggal: new Date('2024-01-05'),
        nilai: 500000000,
        dokumen: 'HPS Pengadaan Laptop 2024',
      },
    },
    
    prosesPengadaan: {
      pengumumanLelang: {
        tanggal: new Date('2024-01-15'),
        media: 'LPSE',
        nomorPengumuman: 'PGM-001/2024',
      },
      pendaftaranPeserta: {
        tanggalMulai: new Date('2024-01-16'),
        tanggalSelesai: new Date('2024-01-25'),
        jumlahPendaftar: 8,
      },
      evaluasiPenawaran: {
        tanggal: new Date('2024-01-30'),
        jumlahPenawaran: 6,
        metodePenilaian: 'Sistem Gugur',
      },
    },
    
    prosesKontrak: {
      penetapanPemenang: {
        tanggal: new Date('2024-02-05'),
        pemenang: 'PT. Teknologi Maju',
        nilaiKontrak: 485000000,
      },
      penandatangananKontrak: {
        tanggal: new Date('2024-02-10'),
        nomorKontrak: 'KTR-001/2024',
        masaBerlaku: {
          mulai: new Date('2024-02-10'),
          selesai: new Date('2024-05-10'),
        },
      },
    },
  },
  
  {
    namaPengadaan: 'Jasa Konsultansi Sistem Informasi',
    nilaiPengadaan: 750000000,
    tanggalPengadaan: new Date('2024-01-20'),
    status: PengadaanStatus.DRAFT,
    kategori: PengadaanKategori.KONSULTANSI,
    deskripsi: 'Jasa konsultansi untuk pengembangan sistem informasi terintegrasi',
    
    dataUmumPengadaan: {
      kodePengadaan: 'PGD-2024-002',
      namaPaket: 'Konsultansi SI Terintegrasi 2024',
      jenisKontrak: 'Jasa Konsultansi',
      metodePengadaan: 'Seleksi Umum',
      nilaiTotal: {
        amount: 750000000,
        currency: Currency.IDR,
      },
      sumberDana: 'APBN',
      tahunAnggaran: 2024,
      lokasiPekerjaan: 'Jakarta',
      waktuPelaksanaan: {
        mulai: new Date('2024-03-01'),
        selesai: new Date('2024-12-31'),
        durasi: 10,
        satuan: 'bulan',
      },
    },
    
    prosesPersiapanPengadaan: {
      identifikasiKebutuhan: {
        tanggal: new Date('2023-11-15'),
        dokumen: 'Roadmap IT 2024-2026',
        pic: 'Bagian Perencanaan',
      },
      studiKelayakan: {
        tanggal: new Date('2023-12-20'),
        hasil: 'Layak',
        dokumen: 'Feasibility Study SI Terintegrasi',
      },
    },
  },
  
  {
    namaPengadaan: 'Konstruksi Gedung Kantor Cabang',
    nilaiPengadaan: 2500000000,
    tanggalPengadaan: new Date('2024-02-01'),
    status: PengadaanStatus.DRAFT,
    kategori: PengadaanKategori.KONSTRUKSI,
    deskripsi: 'Pembangunan gedung kantor cabang baru di Surabaya',
    
    dataUmumPengadaan: {
      kodePengadaan: 'PGD-2024-003',
      namaPaket: 'Konstruksi Gedung Kantor Cabang Surabaya',
      jenisKontrak: 'Konstruksi',
      metodePengadaan: 'Tender Terbuka',
      nilaiTotal: {
        amount: 2500000000,
        currency: Currency.IDR,
      },
      sumberDana: 'APBN',
      tahunAnggaran: 2024,
      lokasiPekerjaan: 'Surabaya, Jawa Timur',
      waktuPelaksanaan: {
        mulai: new Date('2024-04-01'),
        selesai: new Date('2024-12-31'),
        durasi: 9,
        satuan: 'bulan',
      },
    },
  },
  
  {
    namaPengadaan: 'Jasa Kebersihan Kantor',
    nilaiPengadaan: 120000000,
    tanggalPengadaan: new Date('2024-01-10'),
    status: PengadaanStatus.COMPLETED,
    kategori: PengadaanKategori.JASA,
    deskripsi: 'Jasa kebersihan untuk seluruh kantor selama 1 tahun',
    
    dataUmumPengadaan: {
      kodePengadaan: 'PGD-2024-004',
      namaPaket: 'Jasa Kebersihan Kantor 2024',
      jenisKontrak: 'Jasa Lainnya',
      metodePengadaan: 'Penunjukan Langsung',
      nilaiTotal: {
        amount: 120000000,
        currency: Currency.IDR,
      },
      sumberDana: 'APBN',
      tahunAnggaran: 2024,
      lokasiPekerjaan: 'Jakarta',
      waktuPelaksanaan: {
        mulai: new Date('2024-01-01'),
        selesai: new Date('2024-12-31'),
        durasi: 12,
        satuan: 'bulan',
      },
    },
    
    prosesKontrak: {
      penetapanPemenang: {
        tanggal: new Date('2024-01-05'),
        pemenang: 'PT. Bersih Sejahtera',
        nilaiKontrak: 118000000,
      },
      penandatangananKontrak: {
        tanggal: new Date('2024-01-08'),
        nomorKontrak: 'KTR-004/2024',
        masaBerlaku: {
          mulai: new Date('2024-01-01'),
          selesai: new Date('2024-12-31'),
        },
      },
    },
  },
  
  {
    namaPengadaan: 'Pengadaan Kendaraan Operasional',
    nilaiPengadaan: 800000000,
    tanggalPengadaan: new Date('2024-02-15'),
    status: PengadaanStatus.CANCELLED,
    kategori: PengadaanKategori.BARANG,
    deskripsi: 'Pengadaan 5 unit kendaraan operasional (dibatalkan karena perubahan kebijakan)',
    
    dataUmumPengadaan: {
      kodePengadaan: 'PGD-2024-005',
      namaPaket: 'Pengadaan Kendaraan Operasional 2024',
      jenisKontrak: 'Pengadaan Barang',
      metodePengadaan: 'Tender Terbuka',
      nilaiTotal: {
        amount: 800000000,
        currency: Currency.IDR,
      },
      sumberDana: 'APBN',
      tahunAnggaran: 2024,
      lokasiPekerjaan: 'Jakarta',
    },
    
    prosesPersiapanPengadaan: {
      identifikasiKebutuhan: {
        tanggal: new Date('2024-01-01'),
        dokumen: 'Analisis Kebutuhan Kendaraan 2024',
        pic: 'Bagian Umum',
      },
    },
  },
];

/**
 * Seed the database with sample data
 */
async function seedDatabase(): Promise<void> {
  try {
    logger.info('Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');
    
    // Clear existing data (optional - be careful in production!)
    if (config.nodeEnv === 'development') {
      logger.info('Clearing existing pengadaan data...');
      await Pengadaan.deleteMany({});
      logger.info('Existing data cleared');
    }
    
    // Insert sample data
    logger.info('Inserting sample pengadaan data...');
    const insertedPengadaan = await Pengadaan.insertMany(samplePengadaanData);
    logger.info(`Successfully inserted ${insertedPengadaan.length} pengadaan records`);
    
    // Log summary
    const stats = await Pengadaan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$nilaiPengadaan' },
        },
      },
    ]);
    
    logger.info('Seeding summary:');
    stats.forEach(stat => {
      logger.info(`  ${stat._id}: ${stat.count} records, total value: Rp ${stat.totalValue.toLocaleString()}`);
    });
    
    logger.info('Database seeding completed successfully!');
    
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

/**
 * Clear all data from the database
 */
async function clearDatabase(): Promise<void> {
  try {
    logger.info('Starting database clearing...');
    
    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');
    
    // Clear all collections
    logger.info('Clearing all pengadaan data...');
    const result = await Pengadaan.deleteMany({});
    logger.info(`Deleted ${result.deletedCount} pengadaan records`);
    
    logger.info('Database clearing completed successfully!');
    
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

/**
 * Reset database (clear + seed)
 */
async function resetDatabase(): Promise<void> {
  try {
    logger.info('Starting database reset...');
    await clearDatabase();
    await seedDatabase();
    logger.info('Database reset completed successfully!');
  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Main function to handle command line arguments
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'seed':
        await seedDatabase();
        break;
      case 'clear':
        await clearDatabase();
        break;
      case 'reset':
        await resetDatabase();
        break;
      default:
        logger.info('Available commands:');
        logger.info('  npm run seed:db seed   - Seed database with sample data');
        logger.info('  npm run seed:db clear  - Clear all data from database');
        logger.info('  npm run seed:db reset  - Clear and then seed database');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Script failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
export {
  seedDatabase,
  clearDatabase,
  resetDatabase,
  samplePengadaanData,
};

// Run main function if this script is executed directly
if (require.main === module) {
  main();
}

/**
 * Database Seeding Script Documentation
 * 
 * This script provides utilities for populating the database with sample data
 * for development and testing purposes.
 * 
 * **Commands:**
 * - `npm run seed:db seed` - Add sample data to database
 * - `npm run seed:db clear` - Remove all data from database
 * - `npm run seed:db reset` - Clear and then seed database
 * 
 * **Sample Data:**
 * - 5 pengadaan records with different statuses
 * - Various categories (Barang, Jasa, Konstruksi, Konsultansi)
 * - Complete data structure including legacy and detailed fields
 * - Realistic Indonesian procurement scenarios
 * 
 * **Safety Features:**
 * - Environment checks (only clears in development)
 * - Comprehensive error handling
 * - Detailed logging
 * - Graceful database connection management
 * 
 * **Usage in Development:**
 * 1. Set up your .env file with database connection
 * 2. Run `npm run seed:db reset` to start with fresh data
 * 3. Use `npm run seed:db seed` to add more sample data
 * 4. Use `npm run seed:db clear` to clean up
 */