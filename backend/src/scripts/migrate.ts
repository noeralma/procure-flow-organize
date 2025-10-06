import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../utils/logger';
import Pengadaan from '../models/Pengadaan';

/**
 * Database migration script
 * This script handles database schema migrations and data transformations
 */

interface MigrationResult {
  success: boolean;
  message: string;
  affectedDocuments?: number;
  errors?: string[];
}

interface Migration {
  version: string;
  description: string;
  up: () => Promise<MigrationResult>;
  down: () => Promise<MigrationResult>;
}

/**
 * Migration: Add custom ID to existing pengadaan records
 */
const migration_001_add_custom_ids: Migration = {
  version: '001',
  description: 'Add custom IDs to existing pengadaan records',
  
  async up(): Promise<MigrationResult> {
    try {
      logger.info('Running migration 001: Adding custom IDs...');
      
      // Find all pengadaan without custom IDs
      const pengadaanWithoutIds = await Pengadaan.find({
        $or: [
          { customId: { $exists: false } },
          { customId: null },
          { customId: '' },
        ],
      });
      
      logger.info(`Found ${pengadaanWithoutIds.length} pengadaan records without custom IDs`);
      
      let updated = 0;
      const errors: string[] = [];
      
      for (const pengadaan of pengadaanWithoutIds) {
        try {
          // Generate custom ID based on creation date
          const date = pengadaan.createdAt || pengadaan.tanggal || new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          // Find the next sequence number for this date
          const datePrefix = `P-${year}${month}${day}`;
          const existingIds = await Pengadaan.find({
            id: { $regex: `^${datePrefix}-` },
          }).select('id');
          
          const sequenceNumbers = existingIds
            .map(p => {
              const match = p.id?.match(/-([0-9]+)$/);
              return match ? parseInt(match[1]) : 0;
            })
            .filter(n => !isNaN(n));
          
          const nextSequence = sequenceNumbers.length > 0 
            ? Math.max(...sequenceNumbers) + 1 
            : 1;
          
          const customId = `${datePrefix}-${String(nextSequence).padStart(4, '0')}`;
          
          // Update the pengadaan
          await Pengadaan.updateOne(
            { _id: pengadaan._id },
            { $set: { customId } }
          );
          
          updated++;
          logger.info(`  Updated pengadaan ${pengadaan._id} with custom ID: ${customId}`);
          
        } catch (error) {
          const errorMsg = `Failed to update pengadaan ${pengadaan._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Migration 001 completed. Updated ${updated} records.`,
        affectedDocuments: updated,
        errors: errors.length > 0 ? errors : [],
      };
      
    } catch (error) {
      const errorMsg = `Migration 001 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  async down(): Promise<MigrationResult> {
    try {
      logger.info('Rolling back migration 001: Removing custom IDs...');
      
      const result = await Pengadaan.updateMany(
        {},
        { $unset: { customId: 1 } }
      );
      
      return {
        success: true,
        message: `Migration 001 rollback completed. Removed custom IDs from ${result.modifiedCount} records.`,
        affectedDocuments: result.modifiedCount,
      };
      
    } catch (error) {
      const errorMsg = `Migration 001 rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
};

/**
 * Migration: Add indexes for better query performance
 */
const migration_002_add_indexes: Migration = {
  version: '002',
  description: 'Add database indexes for better query performance',
  
  async up(): Promise<MigrationResult> {
    try {
      logger.info('Running migration 002: Adding indexes...');
      
      const collection = mongoose.connection.collection('pengadaans');
      
      // Create indexes
      type IndexSpec = Record<string, 1 | -1 | 'text'>;
      const indexes: IndexSpec[] = [
        { customId: 1 },
        { status: 1 },
        { kategori: 1 },
        { 'dataUmumPengadaan.tahunAnggaran': 1 },
        { tanggalPengadaan: -1 },
        { nilaiPengadaan: -1 },
        { createdAt: -1 },
        { updatedAt: -1 },
        // Compound indexes
        { status: 1, kategori: 1 },
        { 'dataUmumPengadaan.tahunAnggaran': 1, status: 1 },
        // Text index for search
        {
          namaPengadaan: 'text',
          deskripsi: 'text',
          'dataUmumPengadaan.namaPaket': 'text',
          'dataUmumPengadaan.kodePengadaan': 'text',
        },
      ];
      
      let created = 0;
      const errors: string[] = [];
      
      for (const index of indexes) {
        try {
          await collection.createIndex(index);
          created++;
          logger.info(`  Created index: ${JSON.stringify(index)}`);
        } catch (error) {
          const errorMsg = `Failed to create index ${JSON.stringify(index)}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Migration 002 completed. Created ${created} indexes.`,
        affectedDocuments: created,
        errors: errors.length > 0 ? errors : [],
      };
      
    } catch (error) {
      const errorMsg = `Migration 002 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  async down(): Promise<MigrationResult> {
    try {
      logger.info('Rolling back migration 002: Removing indexes...');
      
      const collection = mongoose.connection.collection('pengadaans');
      
      // Get all indexes
      const indexes = await collection.listIndexes().toArray();
      
      let dropped = 0;
      const errors: string[] = [];
      
      for (const index of indexes) {
        // Don't drop the default _id index
        if (index.name === '_id_') continue;
        
        try {
          await collection.dropIndex(index.name);
          dropped++;
          logger.info(`  Dropped index: ${index.name}`);
        } catch (error) {
          const errorMsg = `Failed to drop index ${index.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Migration 002 rollback completed. Dropped ${dropped} indexes.`,
        affectedDocuments: dropped,
        errors: errors.length > 0 ? errors : [],
      };
      
    } catch (error) {
      const errorMsg = `Migration 002 rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
};

/**
 * Migration: Normalize currency fields
 */
const migration_003_normalize_currency: Migration = {
  version: '003',
  description: 'Normalize currency fields to use structured format',
  
  async up(): Promise<MigrationResult> {
    try {
      logger.info('Running migration 003: Normalizing currency fields...');
      
      // Find pengadaan with old currency format
      const pengadaanToUpdate = await Pengadaan.find({
        $or: [
          { 'dataUmumPengadaan.nilaiTotal.currency': { $exists: false } },
          { 'dataUmumPengadaan.nilaiTotal': { $type: 'number' } },
        ],
      });
      
      logger.info(`Found ${pengadaanToUpdate.length} pengadaan records to update`);
      
      let updated = 0;
      const errors: string[] = [];
      
      for (const pengadaan of pengadaanToUpdate) {
        try {
          const updateData: Record<string, unknown> = {};
          type PengadaanDocPartial = {
            dataUmumPengadaan?: { nilaiTotal?: number | { amount: number; currency: string } };
            prosesKontrak?: { penetapanPemenang?: { nilaiKontrak?: number | { amount: number; currency: string } } };
          };
          const pengadaanData = pengadaan as unknown as PengadaanDocPartial;
          
          // Update nilaiTotal if it's a number
          if (pengadaanData.dataUmumPengadaan?.nilaiTotal && typeof pengadaanData.dataUmumPengadaan.nilaiTotal === 'number') {
            updateData['dataUmumPengadaan.nilaiTotal'] = {
              amount: pengadaanData.dataUmumPengadaan.nilaiTotal,
              currency: 'IDR',
            };
          }
          
          // Update nilaiKontrak if it exists and is a number
          if (pengadaanData.prosesKontrak?.penetapanPemenang?.nilaiKontrak && typeof pengadaanData.prosesKontrak.penetapanPemenang.nilaiKontrak === 'number') {
            updateData['prosesKontrak.penetapanPemenang.nilaiKontrak'] = {
              amount: pengadaanData.prosesKontrak.penetapanPemenang.nilaiKontrak,
              currency: 'IDR',
            };
          }
          
          if (Object.keys(updateData).length > 0) {
            await Pengadaan.updateOne(
              { _id: pengadaan._id },
              { $set: updateData }
            );
            
            updated++;
            logger.info(`  Updated pengadaan ${pengadaan._id}`);
          }
          
        } catch (error) {
          const errorMsg = `Failed to update pengadaan ${pengadaan._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Migration 003 completed. Updated ${updated} records.`,
        affectedDocuments: updated,
        errors: errors.length > 0 ? errors : [],
      };
      
    } catch (error) {
      const errorMsg = `Migration 003 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
  
  async down(): Promise<MigrationResult> {
    try {
      logger.info('Rolling back migration 003: Reverting currency normalization...');
      
      // This rollback converts structured currency back to simple numbers
      const pengadaanToRevert = await Pengadaan.find({
        'dataUmumPengadaan.nilaiTotal.amount': { $exists: true },
      });
      
      let reverted = 0;
      const errors: string[] = [];
      
      for (const pengadaan of pengadaanToRevert) {
        try {
          const updateData: Record<string, unknown> = {};
          type PengadaanDocPartial = {
            dataUmumPengadaan?: { nilaiTotal?: { amount?: number } };
            prosesKontrak?: { penetapanPemenang?: { nilaiKontrak?: { amount?: number } } };
          };
          const pengadaanData = pengadaan as unknown as PengadaanDocPartial;
          
          if (pengadaanData.dataUmumPengadaan?.nilaiTotal?.amount) {
            updateData['dataUmumPengadaan.nilaiTotal'] = pengadaanData.dataUmumPengadaan.nilaiTotal.amount;
          }
          
          if (pengadaanData.prosesKontrak?.penetapanPemenang?.nilaiKontrak?.amount) {
            updateData['prosesKontrak.penetapanPemenang.nilaiKontrak'] = pengadaanData.prosesKontrak.penetapanPemenang.nilaiKontrak.amount;
          }
          
          if (Object.keys(updateData).length > 0) {
            await Pengadaan.updateOne(
              { _id: pengadaan._id },
              { $set: updateData }
            );
            
            reverted++;
            logger.info(`  Reverted pengadaan ${pengadaan._id}`);
          }
          
        } catch (error) {
          const errorMsg = `Failed to revert pengadaan ${pengadaan._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Migration 003 rollback completed. Reverted ${reverted} records.`,
        affectedDocuments: reverted,
        errors: errors.length > 0 ? errors : [],
      };
      
    } catch (error) {
      const errorMsg = `Migration 003 rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    }
  },
};

/**
 * All available migrations
 */
const migrations: Migration[] = [
  migration_001_add_custom_ids,
  migration_002_add_indexes,
  migration_003_normalize_currency,
];

/**
 * Migration state management
 */
const MigrationStateSchema = new mongoose.Schema({
  version: { type: String, required: true, unique: true },
  appliedAt: { type: Date, required: true },
  success: { type: Boolean, required: true },
  message: { type: String, required: true },
});

const MigrationStateModel = mongoose.model('MigrationState', MigrationStateSchema);

/**
 * Get applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  const appliedMigrations = await MigrationStateModel.find({ success: true }).sort({ version: 1 });
  return appliedMigrations.map(m => m.version);
}

/**
 * Record migration state
 */
async function recordMigrationState(version: string, result: MigrationResult): Promise<void> {
  await MigrationStateModel.findOneAndUpdate(
    { version },
    {
      version,
      appliedAt: new Date(),
      success: result.success,
      message: result.message,
    },
    { upsert: true }
  );
}

/**
 * Run pending migrations
 */
async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations...');
    
    await connectDatabase();
    logger.info('Connected to database');
    
    const appliedMigrations = await getAppliedMigrations();
    logger.info(`Applied migrations: ${appliedMigrations.join(', ') || 'none'}`);
    
    const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.version));
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      logger.info(`Running migration ${migration.version}: ${migration.description}`);
      
      const result = await migration.up();
      await recordMigrationState(migration.version, result);
      
      if (result.success) {
        logger.info(`✓ Migration ${migration.version} completed successfully`);
      } else {
        logger.error(`✗ Migration ${migration.version} failed: ${result.message}`);
        if (result.errors) {
          result.errors.forEach(error => logger.error(`  - ${error}`));
        }
        throw new Error(`Migration ${migration.version} failed`);
      }
    }
    
    logger.info('All migrations completed successfully!');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

/**
 * Rollback last migration
 */
async function rollbackMigration(version?: string): Promise<void> {
  try {
    logger.info('Starting migration rollback...');
    
    await connectDatabase();
    logger.info('Connected to database');
    
    const appliedMigrations = await getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }
    
    const targetVersion = version || appliedMigrations[appliedMigrations.length - 1];
    
    if (!targetVersion) {
      throw new Error('No migrations to rollback');
    }
    
    const migration = migrations.find(m => m.version === targetVersion);
    
    if (!migration) {
      throw new Error(`Migration ${targetVersion} not found`);
    }
    
    if (!appliedMigrations.includes(targetVersion)) {
      throw new Error(`Migration ${targetVersion} is not applied`);
    }
    
    logger.info(`Rolling back migration ${migration.version}: ${migration.description}`);
    
    const result = await migration.down();
    
    if (result.success) {
      // Remove from migration state
      await MigrationStateModel.deleteOne({ version: targetVersion });
      logger.info(`✓ Migration ${migration.version} rolled back successfully`);
    } else {
      logger.error(`✗ Migration ${migration.version} rollback failed: ${result.message}`);
      if (result.errors) {
        result.errors.forEach(error => logger.error(`  - ${error}`));
      }
      throw new Error(`Migration ${migration.version} rollback failed`);
    }
    
  } catch (error) {
    logger.error('Migration rollback failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
    logger.info('Disconnected from database');
  }
}

/**
 * Show migration status
 */
async function showMigrationStatus(): Promise<void> {
  try {
    await connectDatabase();
    
    const appliedMigrations = await getAppliedMigrations();
    
    logger.info('Migration Status:');
    logger.info('================');
    
    for (const migration of migrations) {
      const isApplied = appliedMigrations.includes(migration.version);
      const status = isApplied ? '✓ Applied' : '✗ Pending';
      logger.info(`${status} - ${migration.version}: ${migration.description}`);
    }
    
    logger.info(`\nTotal: ${migrations.length} migrations, ${appliedMigrations.length} applied, ${migrations.length - appliedMigrations.length} pending`);
    
  } catch (error) {
    logger.error('Failed to show migration status:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  const version = process.argv[3];
  
  try {
    switch (command) {
      case 'up':
        await runMigrations();
        break;
      case 'down':
        await rollbackMigration(version);
        break;
      case 'status':
        await showMigrationStatus();
        break;
      default:
        logger.info('Available commands:');
        logger.info('  npm run migrate up           - Run pending migrations');
        logger.info('  npm run migrate down [version] - Rollback migration');
        logger.info('  npm run migrate status       - Show migration status');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration script failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
export {
  runMigrations,
  rollbackMigration,
  showMigrationStatus,
  migrations,
};

// Run main function if this script is executed directly
if (require.main === module) {
  main();
}

/**
 * Migration Script Documentation
 * 
 * This script provides database migration capabilities for schema changes
 * and data transformations.
 * 
 * **Commands:**
 * - `npm run migrate up` - Run all pending migrations
 * - `npm run migrate down [version]` - Rollback specific or last migration
 * - `npm run migrate status` - Show current migration status
 * 
 * **Available Migrations:**
 * - 001: Add custom IDs to existing pengadaan records
 * - 002: Add database indexes for better performance
 * - 003: Normalize currency fields to structured format
 * 
 * **Features:**
 * - Automatic migration state tracking
 * - Rollback capabilities
 * - Comprehensive error handling
 * - Detailed logging
 * - Safe execution with validation
 * 
 * **Best Practices:**
 * - Always backup database before running migrations
 * - Test migrations in development environment first
 * - Review migration code before applying to production
 * - Monitor migration progress and logs
 */