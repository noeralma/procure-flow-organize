import {
  sanitizeInput,
  commonSchemas,
  pengadaanSchemas,
} from '../../../src/utils/validation';

describe('Validation Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove MongoDB operators', () => {
      const input = {
        name: 'test',
        $where: 'malicious code',
        $regex: 'pattern',
        $ne: 'value',
        nested: {
          $gt: 100,
          valid: 'data',
        },
      };

      const sanitized = sanitizeInput(input);

      expect(sanitized).toEqual({
        name: 'test',
        nested: {
          valid: 'data',
        },
      });
      expect(sanitized).not.toHaveProperty('$where');
      expect(sanitized).not.toHaveProperty('$regex');
      expect(sanitized).not.toHaveProperty('$ne');
      expect(sanitized.nested).not.toHaveProperty('$gt');
    });

    it('should handle arrays with MongoDB operators', () => {
      const input = {
        items: [
          { name: 'item1', $where: 'bad' },
          { name: 'item2', valid: true },
        ],
        $or: [{ a: 1 }, { b: 2 }],
      };

      const sanitized = sanitizeInput(input);

      expect(sanitized).toEqual({
        items: [
          { name: 'item1' },
          { name: 'item2', valid: true },
        ],
      });
      expect(sanitized).not.toHaveProperty('$or');
    });

    it('should handle null and undefined values', () => {
      expect(sanitizeInput(null)).toBeNull();
      expect(sanitizeInput(undefined)).toBeUndefined();
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(0)).toBe(0);
    });

    it('should handle primitive values', () => {
      expect(sanitizeInput('string')).toBe('string');
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              $where: 'malicious',
              valid: 'data',
            },
          },
        },
      };

      const sanitized = sanitizeInput(input);

      expect(sanitized).toEqual({
        level1: {
          level2: {
            level3: {
              valid: 'data',
            },
          },
        },
      });
    });
  });

  describe('Email validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        expect(() => commonSchemas.email.parse(email)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com',
      ];

      invalidEmails.forEach((email) => {
        expect(() => commonSchemas.email.parse(email)).toThrow();
      });
    });
  });

  describe('Password validation', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongPass123!',
        'MyP@ssw0rd',
        'Secure123$',
        'Valid1Pass!',
      ];

      validPasswords.forEach((password) => {
        expect(() => commonSchemas.password.parse(password)).not.toThrow();
      });
    });

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Pass123',
        'pass123!',
      ];

      invalidPasswords.forEach((password) => {
        expect(() => commonSchemas.password.parse(password)).toThrow();
      });
    });
  });

  describe('Username validation', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'testuser',
        'user123',
        'test_user',
        'user-name',
      ];

      validUsernames.forEach((username) => {
        expect(() => commonSchemas.nonEmptyString.parse(username)).not.toThrow();
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '',
      ];

      invalidUsernames.forEach((username) => {
        expect(() => commonSchemas.nonEmptyString.parse(username)).toThrow();
      });
    });
  });

  describe('validateObjectId', () => {
    it('should validate correct ObjectId formats', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '123456789012345678901234',
        'abcdef123456789012345678',
      ];

      validObjectIds.forEach(id => {
        expect(() => commonSchemas.objectId.parse(id)).not.toThrow();
      });
    });

    it('should reject invalid ObjectId formats', () => {
      const invalidObjectIds = [
        'invalid-id',
        'USR1234',                // Too short
        'USR-',                   // Invalid format
        'USR-12345',              // Invalid format
        'USR-123',                // Too short
        'usr-1234',               // Invalid format
        '1234-USR',               // Invalid format
        '',                       // Empty
        'USR-12AB',               // Invalid format
        '507f1f77bcf86cd79943901',  // Too short (23 chars)
        '507f1f77bcf86cd7994390111', // Too long (25 chars)
      ];

      invalidObjectIds.forEach(id => {
        expect(() => commonSchemas.objectId.parse(id)).toThrow();
      });
    });
  });

  describe('Pengadaan schemas', () => {
    describe('Create schema', () => {
      it('should validate correct pengadaan creation data', () => {
        const validData = {
          // Legacy fields
          nama: 'Test Pengadaan',
          kategori: 'Barang',
          vendor: 'Test Vendor',
          nilai: 1000000,
          status: 'Draft',
          tanggal: '2024-01-01',
          deadline: '2024-12-31',
          deskripsi: 'Test description',
          
          // DATA UMUM PENGADAAN
          dataUmumPengadaan: {
            namaPengadaan: 'Test Pengadaan',
            jenisPengadaan: 'Barang',
            metodePengadaan: 'Tender Terbuka',
            nilaiPagu: 1000000,
            sumberDana: 'APBN',
            lokasiPekerjaan: 'Jakarta',
            waktuPelaksanaan: {
              mulai: '2024-01-01',
              selesai: '2024-12-31',
            },
            satuanKerja: 'Unit Test',
            ppk: 'PPK Test',
            pejabatPengadaan: 'Pejabat Test',
          },
          
          // PROSES PERSIAPAN PENGADAAN
          prosesPersiapanPengadaan: {
            identifikasiKebutuhan: {
              tanggal: '2024-01-01',
              pic: 'PIC Test',
              dokumen: 'dokumen.pdf',
              status: 'SELESAI',
              catatan: 'Test catatan',
            },
            penyusunanHPS: {
              tanggal: '2024-01-02',
              pic: 'PIC HPS',
              dokumen: 'hps.pdf',
              status: 'SELESAI',
              nilaiHPS: 1000000,
              catatan: 'HPS catatan',
            },
            penyusunanSpesifikasi: {
              tanggal: '2024-01-03',
              pic: 'PIC Spek',
              dokumen: 'spek.pdf',
              status: 'SELESAI',
              catatan: 'Spek catatan',
            },
            penetapanMetode: {
              tanggal: '2024-01-04',
              pic: 'PIC Metode',
              metode: 'Tender Terbuka',
              alasan: 'Nilai di atas threshold',
              dokumen: 'metode.pdf',
              status: 'SELESAI',
              catatan: 'Metode catatan',
            },
          },
          
          // PROSES PENGADAAN
          prosesPengadaan: {
            pengumumanLelang: {
              tanggalMulai: '2024-02-01',
              tanggalSelesai: '2024-02-15',
              media: 'LPSE',
              dokumen: 'pengumuman.pdf',
              status: 'SELESAI',
              catatan: 'Pengumuman catatan',
            },
            pendaftaranPeserta: {
              tanggalMulai: '2024-02-01',
              tanggalSelesai: '2024-02-15',
              jumlahPendaftar: 5,
              dokumen: 'pendaftaran.pdf',
              status: 'SELESAI',
              catatan: 'Pendaftaran catatan',
            },
            evaluasiKualifikasi: {
              tanggal: '2024-02-16',
              pic: 'PIC Evaluasi',
              jumlahLulus: 3,
              dokumen: 'evaluasi.pdf',
              status: 'SELESAI',
              catatan: 'Evaluasi catatan',
            },
            evaluasiTeknis: {
              tanggal: '2024-02-17',
              pic: 'PIC Teknis',
              jumlahLulus: 2,
              dokumen: 'teknis.pdf',
              status: 'SELESAI',
              catatan: 'Teknis catatan',
            },
            evaluasiHarga: {
              tanggal: '2024-02-18',
              pic: 'PIC Harga',
              penawaranTerendah: 950000,
              dokumen: 'harga.pdf',
              status: 'SELESAI',
              catatan: 'Harga catatan',
            },
            penetapanPemenang: {
              tanggal: '2024-02-19',
              pic: 'PIC Penetapan',
              pemenang: 'PT Winner',
              nilaiKontrak: 950000,
              dokumen: 'penetapan.pdf',
              status: 'SELESAI',
              catatan: 'Penetapan catatan',
            },
          },
          
          // PROSES KONTRAK
          prosesKontrak: {
            persiapanKontrak: {
              tanggal: '2024-02-20',
              pic: 'PIC Kontrak',
              dokumen: 'kontrak.pdf',
              status: 'SELESAI',
              catatan: 'Kontrak catatan',
            },
            penandatangananKontrak: {
               tanggal: '2024-02-21',
               pic: 'PIC TTD',
               nomorKontrak: 'K-001/2024',
               nilaiKontrak: 950000,
               waktuPelaksanaan: {
                 mulai: '2024-03-01',
                 selesai: '2024-12-31',
               },
               dokumen: 'ttd.pdf',
               status: 'SELESAI',
               catatan: 'TTD catatan',
             },
             serahTerimaKontrak: {
               tanggal: '2024-02-22',
               pic: 'PIC Serah Terima',
               dokumen: 'serahterima.pdf',
               status: 'SELESAI',
               catatan: 'Serah terima catatan',
             },
          },
        };

        expect(() => pengadaanSchemas.create.parse(validData)).not.toThrow();
      });

      it('should reject invalid pengadaan creation data', () => {
        const invalidData = {
          // Missing required fields
          nama: 'Test',
        };

        expect(() => pengadaanSchemas.create.parse(invalidData)).toThrow();
      });
    });

    describe('Update schema', () => {
      it('should validate correct pengadaan update data', () => {
        const validData = {
          nama: 'Updated Pengadaan',
          deskripsi: 'Updated description',
        };

        expect(() => pengadaanSchemas.update.parse(validData)).not.toThrow();
      });

      it('should allow partial updates', () => {
        const partialData = {
          nama: 'Only name update',
        };

        expect(() => pengadaanSchemas.update.parse(partialData)).not.toThrow();
      });
    });
  });
});