import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Pengadaan } from "@/types/pengadaan";
import { formatCurrency } from "@/lib/utils";

interface PengadaanDetailProps {
  pengadaan: Pengadaan;
  onClose: () => void;
}

export const PengadaanDetail = ({ onClose, pengadaan }: PengadaanDetailProps) => {
  if (!pengadaan) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            Detail Pengadaan: {pengadaan.namaPaket || pengadaan.nama}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Section 1: DATA UMUM PENGADAAN */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">DATA UMUM PENGADAAN</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Sinergi/ Non Sinergi</p>
                <p className="text-sm">{pengadaan.sinergi || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nama Paket Pengadaan</p>
                <p className="text-sm font-semibold">{pengadaan.namaPaket || pengadaan.nama || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Lap PTM</p>
                <p className="text-sm">{pengadaan.lapPtm || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">SLA/ Non SLA</p>
                <p className="text-sm">{pengadaan.sla || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tahun SLA</p>
                <p className="text-sm">{pengadaan.tahunSla || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">CostSaving/ Non CostSaving</p>
                <p className="text-sm">{pengadaan.costSaving || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tahun CostSaving</p>
                <p className="text-sm">{pengadaan.tahunCostSaving || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Barang/Jasa</p>
                <Badge variant="outline">{pengadaan.barangJasa || pengadaan.kategori || "-"}</Badge>
              </div>
            </div>
          </div>

          {/* Section 2: PROSES PERSIAPAN PENGADAAN */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-600">PROSES PERSIAPAN PENGADAAN</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Pengguna Barang/ Jasa</p>
                <p className="text-sm">{pengadaan.penggunaBarangJasa || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Jenis Paket</p>
                <p className="text-sm">{pengadaan.jenisPaket || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Jenis Pengadaan</p>
                <p className="text-sm">{pengadaan.jenisPengadaan || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Baseline</p>
                <p className="text-sm">{pengadaan.baseline || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">No PPL</p>
                <p className="text-sm">{pengadaan.noPpl || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Metode Pengadaan</p>
                <p className="text-sm">{pengadaan.metodePengadaan || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tahun Anggaran</p>
                <p className="text-sm">{pengadaan.tahunAnggaran || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Jenis Anggaran</p>
                <p className="text-sm">{pengadaan.jenisAnggaran || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Jenis Kontrak</p>
                <p className="text-sm">{pengadaan.jenisKontrak || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai Anggaran (IDR)</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiAnggaranIdr || "0", "IDR")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai Anggaran (USD)</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiAnggaranUsd || "0", "USD")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai HPS</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiHpsAmount || "0", pengadaan.nilaiHpsCurrency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Bulan Permintaan</p>
                <p className="text-sm">{pengadaan.bulanPermintaan || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Tanggal Permintaan</p>
                <p className="text-sm">{formatDate(pengadaan.tanggalPermintaan)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">PIC Tim PPSM</p>
                <p className="text-sm">{pengadaan.picTimPpsm || "-"}</p>
              </div>
            </div>
          </div>

          {/* Section 3: PROSES PENGADAAN */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-600">PROSES PENGADAAN</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Surat Penunjukan</p>
                <p className="text-sm">{pengadaan.suratPenunjukan || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Lama Proses Pengadaan</p>
                <p className="text-sm">{pengadaan.lamaProsesPengadaan || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Jangka Waktu Pengerjaan</p>
                <p className="text-sm">{pengadaan.jangkaWaktuPengerjaan || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai Penunjukan</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiPenunjukanAmount || "0", pengadaan.nilaiPenunjukanCurrency)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Status Pengadaan</p>
                <Badge className={getStatusColor(pengadaan.statusPengadaan || pengadaan.status)}>
                  {pengadaan.statusPengadaan || pengadaan.status || "-"}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Bulan Selesai</p>
                <p className="text-sm">{pengadaan.bulanSelesai || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Keterangan Pengadaan</p>
                <p className="text-sm">{pengadaan.keteranganPengadaan || "-"}</p>
              </div>
            </div>
          </div>

          {/* Section 4: PROSES KONTRAK */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-purple-600">PROSES KONTRAK</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Cost Saving (Rp)</p>
                <p className="text-sm">{formatCurrency(pengadaan.costSavingRp || "0", "IDR")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai Kontrak (Rupiah)</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiKontrakRupiah || "0", "IDR")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai Kontrak (USD)</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiKontrakUsd || "0", "USD")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nilai Kontrak Porsi Tahun</p>
                <p className="text-sm">{formatCurrency(pengadaan.nilaiKontrakPortiTahun || "0", "IDR")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Penyedia Barang/ Jasa/ Konsultan</p>
                <p className="text-sm">{pengadaan.penyediaBarangJasa || pengadaan.vendor || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Status Penyedia</p>
                <p className="text-sm">{pengadaan.statusPenyedia || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Kontrak Nomor</p>
                <p className="text-sm">{pengadaan.kontrakNomor || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Kontrak Tanggal</p>
                <p className="text-sm">{formatDate(pengadaan.kontrakTanggal || pengadaan.deadline)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case "Selesai":
      return "bg-green-100 text-green-800";
    case "Proses Evaluasi":
      return "bg-orange-100 text-orange-800";
    case "Penawaran":
      return "bg-blue-100 text-blue-800";
    case "Draft":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};