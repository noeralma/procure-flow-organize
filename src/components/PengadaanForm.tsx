import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCreatePengadaan, useUpdatePengadaan } from "@/services/pengadaan";
import type { Pengadaan } from "@/types/pengadaan";

interface PengadaanFormProps {
  onClose: () => void;
  pengadaan?: Pengadaan;
}

// Mock exchange rate - in real app, this would come from an API
const USD_TO_IDR_RATE = 15000;

export const PengadaanForm = ({ onClose, pengadaan }: PengadaanFormProps) => {
  const { toast } = useToast();
  const createPengadaan = useCreatePengadaan();
  const updatePengadaan = useUpdatePengadaan();

  const [formData, setFormData] = useState({
    // Section 1: DATA UMUM PENGADAAN
    sinergi: pengadaan?.sinergi || "",
    namaPaket: pengadaan?.namaPaket || "",
    lapPtm: pengadaan?.lapPtm || "",
    sla: pengadaan?.sla || "",
    tahunSla: pengadaan?.tahunSla || "",
    costSaving: pengadaan?.costSaving || "",
    tahunCostSaving: pengadaan?.tahunCostSaving || "",
    barangJasa: pengadaan?.barangJasa || "",

    // Section 2: PROSES PERSIAPAN PENGADAAN
    penggunaBarangJasa: pengadaan?.penggunaBarangJasa || "",
    jenisPaket: pengadaan?.jenisPaket || "",
    jenisPengadaan: pengadaan?.jenisPengadaan || "",
    baseline: pengadaan?.baseline || "",
    noPpl: pengadaan?.noPpl || "",
    metodePengadaan: pengadaan?.metodePengadaan || "",
    tahunAnggaran: pengadaan?.tahunAnggaran || "",
    jenisAnggaran: pengadaan?.jenisAnggaran || "",
    jenisKontrak: pengadaan?.jenisKontrak || "",
    nilaiAnggaranIdr: pengadaan?.nilaiAnggaranIdr || "",
    nilaiAnggaranUsd: pengadaan?.nilaiAnggaranUsd || "",
    nilaiHpsCurrency: pengadaan?.nilaiHpsCurrency || "IDR",
    nilaiHpsAmount: pengadaan?.nilaiHpsAmount || "",
    nilaiHpsEqRupiah: pengadaan?.nilaiHpsEqRupiah || "",
    nilaiHpsPortiTahun: pengadaan?.nilaiHpsPortiTahun || "",
    bulanPermintaan: pengadaan?.bulanPermintaan || "",
    tanggalPermintaan: pengadaan?.tanggalPermintaan || "",
    tanggalPermintaanDiterima: pengadaan?.tanggalPermintaanDiterima || "",
    tanggalRapatPersiapan: pengadaan?.tanggalRapatPersiapan || "",
    tanggalRevisiPermintaan: pengadaan?.tanggalRevisiPermintaan || "",
    lamaRevisiPermintaan: pengadaan?.lamaRevisiPermintaan || "",
    noPurchaseRequisition: pengadaan?.noPurchaseRequisition || "",
    tanggalPurchaseRequisition: pengadaan?.tanggalPurchaseRequisition || "",
    jenisMySap: pengadaan?.jenisMySap || "",
    tanggalPerintahPengadaan: pengadaan?.tanggalPerintahPengadaan || "",
    lamaProsesPersiapan: pengadaan?.lamaProsesPersiapan || "",
    kategoriRisiko: pengadaan?.kategoriRisiko || "",
    keteranganPersiapan: pengadaan?.keteranganPersiapan || "",
    picTimPpsm: pengadaan?.picTimPpsm || "",

    // Section 3: PROSES PENGADAAN
    suratPenunjukan: pengadaan?.suratPenunjukan || "",
    lamaProsesPengadaan: pengadaan?.lamaProsesPengadaan || "",
    jangkaWaktuPengerjaan: pengadaan?.jangkaWaktuPengerjaan || "",
    nilaiPenunjukanCurrency: pengadaan?.nilaiPenunjukanCurrency || "IDR",
    nilaiPenunjukanAmount: pengadaan?.nilaiPenunjukanAmount || "",
    nilaiPenunjukanEqRupiah: pengadaan?.nilaiPenunjukanEqRupiah || "",
    statusPengadaan: pengadaan?.statusPengadaan || "",
    bulanSelesai: pengadaan?.bulanSelesai || "",
    keteranganPengadaan: pengadaan?.keteranganPengadaan || "",

    // Section 4: PROSES KONTRAK
    costSavingRp: pengadaan?.costSavingRp || "",
    nilaiKontrakRupiah: pengadaan?.nilaiKontrakRupiah || "",
    nilaiKontrakUsd: pengadaan?.nilaiKontrakUsd || "",
    nilaiKontrakPortiTahun: pengadaan?.nilaiKontrakPortiTahun || "",
    penyediaBarangJasa: pengadaan?.penyediaBarangJasa || "",
    statusPenyedia: pengadaan?.statusPenyedia || "",
    kontrakNomor: pengadaan?.kontrakNomor || "",
    kontrakTanggal: pengadaan?.kontrakTanggal || "",
  });

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Handle currency conversion
  useEffect(() => {
    if (formData.nilaiAnggaranUsd) {
      const usdValue = parseFloat(formData.nilaiAnggaranUsd);
      if (!isNaN(usdValue)) {
        setFormData(prev => ({
          ...prev,
          nilaiAnggaranIdr: (usdValue * USD_TO_IDR_RATE).toString()
        }));
      }
    }
  }, [formData.nilaiAnggaranUsd]);

  useEffect(() => {
    if (formData.nilaiPenunjukanCurrency === "USD" && formData.nilaiPenunjukanAmount) {
      const usdValue = parseFloat(formData.nilaiPenunjukanAmount);
      if (!isNaN(usdValue)) {
        setFormData(prev => ({
          ...prev,
          nilaiPenunjukanEqRupiah: (usdValue * USD_TO_IDR_RATE).toString()
        }));
      }
    }
  }, [formData.nilaiPenunjukanCurrency, formData.nilaiPenunjukanAmount]);

  // Calculate cost saving automatically
  useEffect(() => {
    if (formData.statusPengadaan === "SELESAI" && formData.nilaiHpsEqRupiah && formData.nilaiPenunjukanEqRupiah) {
      const hpsValue = parseFloat(formData.nilaiHpsEqRupiah);
      const penunjukanValue = parseFloat(formData.nilaiPenunjukanEqRupiah);
      if (!isNaN(hpsValue) && !isNaN(penunjukanValue) && penunjukanValue > 0) {
        const costSaving = hpsValue - penunjukanValue;
        setFormData(prev => ({
          ...prev,
          costSavingRp: costSaving.toString()
        }));
      }
    }
  }, [formData.statusPengadaan, formData.nilaiHpsEqRupiah, formData.nilaiPenunjukanEqRupiah]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Map comprehensive form data to include legacy fields for backward compatibility
      const pengadaanData = {
        ...formData,
        // Map new fields to legacy fields for backward compatibility
        nama: formData.namaPaket || "Untitled",
        kategori: formData.barangJasa || "Barang",
        vendor: formData.penyediaBarangJasa || "TBD",
        nilai: formData.nilaiHpsEqRupiah || "0",
        status: formData.statusPengadaan || "Draft",
        tanggal: formData.tanggalPermintaan || new Date().toISOString().split('T')[0],
        deadline: formData.kontrakTanggal || new Date().toISOString().split('T')[0],
        deskripsi: `${formData.jenisPengadaan || "Pengadaan"} - ${formData.metodePengadaan || "Standar"}`,
      };

      if (pengadaan) {
        await updatePengadaan.mutateAsync({
          id: pengadaan.id,
          data: pengadaanData,
        });
        toast({
          title: "Berhasil!",
          description: `Pengadaan "${formData.namaPaket}" telah diperbarui.`,
        });
      } else {
        await createPengadaan.mutateAsync(pengadaanData);
        toast({
          title: "Berhasil!",
          description: `Pengadaan "${formData.namaPaket}" telah ditambahkan.`,
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error!",
        description: "Gagal menyimpan pengadaan.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            {pengadaan ? "Edit Pengadaan" : "Tambah Pengadaan Baru"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: DATA UMUM PENGADAAN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">DATA UMUM PENGADAAN</h3>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sinergi">Sinergi/ Non Sinergi *</Label>
                  <Select value={formData.sinergi} onValueChange={(value) => handleChange("sinergi", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Sinergi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sinergi">Sinergi</SelectItem>
                      <SelectItem value="Non Sinergi">Non Sinergi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="namaPaket">Nama Paket Pengadaan *</Label>
                  <Input
                    id="namaPaket"
                    value={formData.namaPaket}
                    onChange={(e) => handleChange("namaPaket", e.target.value)}
                    placeholder="Masukkan nama paket pengadaan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lapPtm">Lap PTM *</Label>
                  <Select value={formData.lapPtm} onValueChange={(value) => handleChange("lapPtm", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Lap PTM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PTM">PTM</SelectItem>
                      <SelectItem value="Non PTM">Non PTM</SelectItem>
                      <SelectItem value="PTM-2024">PTM-2024</SelectItem>
                      <SelectItem value="PTM-2025">PTM-2025</SelectItem>
                      <SelectItem value="PTM-2024 PTM-2025">PTM-2024 PTM-2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sla">SLA/ Non SLA</Label>
                  <Select value={formData.sla} onValueChange={(value) => handleChange("sla", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih SLA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SLA">SLA</SelectItem>
                      <SelectItem value="Non SLA">Non SLA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tahunSla">Tahun SLA</Label>
                  <Select value={formData.tahunSla} onValueChange={(value) => handleChange("tahunSla", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costSaving">CostSaving/ Non CostSaving</Label>
                  <Select value={formData.costSaving} onValueChange={(value) => handleChange("costSaving", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih CostSaving" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CostSaving">CostSaving</SelectItem>
                      <SelectItem value="Non CostSaving">Non CostSaving</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tahunCostSaving">Tahun CostSaving</Label>
                  <Select value={formData.tahunCostSaving} onValueChange={(value) => handleChange("tahunCostSaving", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barangJasa">Barang/Jasa *</Label>
                  <Select value={formData.barangJasa} onValueChange={(value) => handleChange("barangJasa", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Barang/Jasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barang">Barang</SelectItem>
                      <SelectItem value="Barang Sinergi">Barang Sinergi</SelectItem>
                      <SelectItem value="Jasa Sinergi">Jasa Sinergi</SelectItem>
                      <SelectItem value="Jasa">Jasa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section 2: PROSES PERSIAPAN PENGADAAN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600">PROSES PERSIAPAN PENGADAAN</h3>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penggunaBarangJasa">Pengguna Barang/ Jasa *</Label>
                  <Select value={formData.penggunaBarangJasa} onValueChange={(value) => handleChange("penggunaBarangJasa", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Pengguna" />
                    </SelectTrigger>
                    <SelectContent>
                      {["ACCT", "AFM", "BD", "CGP", "CORCOM", "CORFIN", "CSR", "CSS", "CST", "ET", "FCMA", "GCR", "GLS", "GLSM", "HCM", "HSSE", "ICT", "IR", "IT-BP", "IT-DP", "IT-TP", "LCC", "OMM", "PCCM", "PMO", "PRC", "RM", "SCM", "SOR I", "SOR II", "SOR III", "SOR III-ROM", "SOR II-ROM", "SOR IV"].map(item => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisPaket">Jenis Paket Pengadaan (Strategis/Operasional) *</Label>
                  <Select value={formData.jenisPaket} onValueChange={(value) => handleChange("jenisPaket", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Paket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Strategis">Strategis</SelectItem>
                      <SelectItem value="Operasional">Operasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisPengadaan">Jenis Pengadaan *</Label>
                  <Select value={formData.jenisPengadaan} onValueChange={(value) => handleChange("jenisPengadaan", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Pengadaan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barang">Barang</SelectItem>
                      <SelectItem value="Jasa Lainnya">Jasa Lainnya</SelectItem>
                      <SelectItem value="Jasa Konstruksi">Jasa Konstruksi</SelectItem>
                      <SelectItem value="Jasa Konsultasi">Jasa Konsultasi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseline">Baseline *</Label>
                  <Select value={formData.baseline} onValueChange={(value) => handleChange("baseline", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Baseline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baseline">Baseline</SelectItem>
                      <SelectItem value="Non Baseline">Non Baseline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="noPpl">No PPL *</Label>
                  <Input
                    id="noPpl"
                    value={formData.noPpl}
                    onChange={(e) => handleChange("noPpl", e.target.value)}
                    placeholder="Masukkan No PPL"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodePengadaan">Metode Pengadaan *</Label>
                  <Input
                    id="metodePengadaan"
                    value={formData.metodePengadaan}
                    onChange={(e) => handleChange("metodePengadaan", e.target.value)}
                    placeholder="Masukkan Metode Pengadaan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tahunAnggaran">Tahun Anggaran *</Label>
                  <Select value={formData.tahunAnggaran} onValueChange={(value) => handleChange("tahunAnggaran", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisAnggaran">Jenis Anggaran *</Label>
                  <Select value={formData.jenisAnggaran} onValueChange={(value) => handleChange("jenisAnggaran", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis Anggaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ABO">ABO</SelectItem>
                      <SelectItem value="ABI">ABI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisKontrak">Jenis Kontrak Lumsum / Satuan / Gabungan/dll *</Label>
                  <Input
                    id="jenisKontrak"
                    value={formData.jenisKontrak}
                    onChange={(e) => handleChange("jenisKontrak", e.target.value)}
                    placeholder="Masukkan Jenis Kontrak"
                    required
                  />
                </div>
              </div>

              {/* Nilai Anggaran */}
              <div className="space-y-4">
                <h4 className="font-medium">Nilai Anggaran *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nilaiAnggaranUsd">USD</Label>
                    <Input
                      id="nilaiAnggaranUsd"
                      type="number"
                      value={formData.nilaiAnggaranUsd}
                      onChange={(e) => handleChange("nilaiAnggaranUsd", e.target.value)}
                      placeholder="Masukkan nilai USD"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nilaiAnggaranIdr">IDR</Label>
                    <Input
                      id="nilaiAnggaranIdr"
                      type="number"
                      value={formData.nilaiAnggaranIdr}
                      onChange={(e) => handleChange("nilaiAnggaranIdr", e.target.value)}
                      placeholder="Masukkan nilai IDR"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Nilai HPS */}
              <div className="space-y-4">
                <h4 className="font-medium">Nilai HPS *</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sesuai Lembar Pengesahan</Label>
                    <div className="flex gap-2">
                      <Select value={formData.nilaiHpsCurrency} onValueChange={(value) => handleChange("nilaiHpsCurrency", value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="IDR">IDR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={formData.nilaiHpsAmount}
                        onChange={(e) => handleChange("nilaiHpsAmount", e.target.value)}
                        placeholder="Masukkan nilai"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nilaiHpsEqRupiah">Eq. Rupiah IDR</Label>
                    <Input
                      id="nilaiHpsEqRupiah"
                      type="number"
                      value={formData.nilaiHpsEqRupiah}
                      onChange={(e) => handleChange("nilaiHpsEqRupiah", e.target.value)}
                      placeholder="Masukkan nilai IDR"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nilaiHpsPortiTahun">Porsi tahun berjalan</Label>
                    <Input
                      id="nilaiHpsPortiTahun"
                      type="number"
                      value={formData.nilaiHpsPortiTahun}
                      onChange={(e) => handleChange("nilaiHpsPortiTahun", e.target.value)}
                      placeholder="Masukkan porsi tahun"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulanPermintaan">Bulan Permintaan *</Label>
                  <Input
                    id="bulanPermintaan"
                    type="month"
                    value={formData.bulanPermintaan}
                    onChange={(e) => handleChange("bulanPermintaan", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalPermintaan">Tanggal Permintaan *</Label>
                  <Input
                    id="tanggalPermintaan"
                    type="date"
                    value={formData.tanggalPermintaan}
                    onChange={(e) => handleChange("tanggalPermintaan", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalPermintaanDiterima">Tanggal Permintaan diterima *</Label>
                  <Input
                    id="tanggalPermintaanDiterima"
                    type="date"
                    value={formData.tanggalPermintaanDiterima}
                    onChange={(e) => handleChange("tanggalPermintaanDiterima", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalRapatPersiapan">Tanggal Rapat Persiapan *</Label>
                  <Input
                    id="tanggalRapatPersiapan"
                    type="date"
                    value={formData.tanggalRapatPersiapan}
                    onChange={(e) => handleChange("tanggalRapatPersiapan", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalRevisiPermintaan">Tanggal Revisi Permintaan</Label>
                  <Input
                    id="tanggalRevisiPermintaan"
                    type="date"
                    value={formData.tanggalRevisiPermintaan}
                    onChange={(e) => handleChange("tanggalRevisiPermintaan", e.target.value)}
                  />
                </div>

                {formData.tanggalRevisiPermintaan && (
                  <div className="space-y-2">
                    <Label htmlFor="lamaRevisiPermintaan">Berapa lama Revisi Permintaan?</Label>
                    <Input
                      id="lamaRevisiPermintaan"
                      value={formData.lamaRevisiPermintaan}
                      onChange={(e) => handleChange("lamaRevisiPermintaan", e.target.value)}
                      placeholder="Masukkan lama revisi"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="noPurchaseRequisition">No Purchase Requisition *</Label>
                  <Input
                    id="noPurchaseRequisition"
                    value={formData.noPurchaseRequisition}
                    onChange={(e) => handleChange("noPurchaseRequisition", e.target.value)}
                    placeholder="Masukkan No Purchase Requisition"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalPurchaseRequisition">Tanggal Purchase Requisition MySAP *</Label>
                  <Input
                    id="tanggalPurchaseRequisition"
                    type="date"
                    value={formData.tanggalPurchaseRequisition}
                    onChange={(e) => handleChange("tanggalPurchaseRequisition", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenisMySap">Jenis MySAP *</Label>
                  <Select value={formData.jenisMySap} onValueChange={(value) => handleChange("jenisMySap", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Jenis MySAP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OA">OA</SelectItem>
                      <SelectItem value="PO">PO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalPerintahPengadaan">Tanggal Perintah Pengadaan/ Flip to Project/ Mark As Complete *</Label>
                  <Input
                    id="tanggalPerintahPengadaan"
                    type="date"
                    value={formData.tanggalPerintahPengadaan}
                    onChange={(e) => handleChange("tanggalPerintahPengadaan", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lamaProsesPersiapan">Lama Proses Persiapan Pengadaan (Hari Kerja) *</Label>
                  <Input
                    id="lamaProsesPersiapan"
                    value={formData.lamaProsesPersiapan}
                    onChange={(e) => handleChange("lamaProsesPersiapan", e.target.value)}
                    placeholder="Masukkan lama proses"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategoriRisiko">Kategori Risiko *</Label>
                  <Select value={formData.kategoriRisiko} onValueChange={(value) => handleChange("kategoriRisiko", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori Risiko" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T">T</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="R">R</SelectItem>
                      <SelectItem value="Tidak diperlukan (Barang tanpa instalasi)">Tidak diperlukan (Barang tanpa instalasi)</SelectItem>
                      <SelectItem value="Belum Disampaikan">Belum Disampaikan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keteranganPersiapan">Keterangan</Label>
                  <Input
                    id="keteranganPersiapan"
                    value={formData.keteranganPersiapan}
                    onChange={(e) => handleChange("keteranganPersiapan", e.target.value)}
                    placeholder="Masukkan keterangan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="picTimPpsm">PIC TIM PPSM *</Label>
                  <Input
                    id="picTimPpsm"
                    value={formData.picTimPpsm}
                    onChange={(e) => handleChange("picTimPpsm", e.target.value)}
                    placeholder="Masukkan PIC TIM PPSM"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: PROSES PENGADAAN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-600">PROSES PENGADAAN</h3>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="suratPenunjukan">Surat Penunjukan Pelaksana Pekerjaan *</Label>
                  <Input
                    id="suratPenunjukan"
                    type="date"
                    value={formData.suratPenunjukan}
                    onChange={(e) => handleChange("suratPenunjukan", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lamaProsesPengadaan">Lama Proses Pengadaan (Hari Kerja) *</Label>
                  <Input
                    id="lamaProsesPengadaan"
                    value={formData.lamaProsesPengadaan}
                    onChange={(e) => handleChange("lamaProsesPengadaan", e.target.value)}
                    placeholder="Masukkan lama proses"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jangkaWaktuPengerjaan">Jangka Waktu Pengerjaan</Label>
                  <Input
                    id="jangkaWaktuPengerjaan"
                    value={formData.jangkaWaktuPengerjaan}
                    onChange={(e) => handleChange("jangkaWaktuPengerjaan", e.target.value)}
                    placeholder="Masukkan jangka waktu"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nilai Penunjukan (USD / IDR) *</Label>
                  <div className="flex gap-2">
                    <Select value={formData.nilaiPenunjukanCurrency} onValueChange={(value) => handleChange("nilaiPenunjukanCurrency", value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="IDR">IDR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={formData.nilaiPenunjukanAmount}
                      onChange={(e) => handleChange("nilaiPenunjukanAmount", e.target.value)}
                      placeholder="Masukkan nilai"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nilaiPenunjukanEqRupiah">Eq. Rupiah (IDR) *</Label>
                  <Input
                    id="nilaiPenunjukanEqRupiah"
                    type="number"
                    value={formData.nilaiPenunjukanEqRupiah}
                    onChange={(e) => handleChange("nilaiPenunjukanEqRupiah", e.target.value)}
                    placeholder="Masukkan nilai IDR"
                    required
                    readOnly={formData.nilaiPenunjukanCurrency === "USD"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusPengadaan">Status Pengadaan *</Label>
                  <Select value={formData.statusPengadaan} onValueChange={(value) => handleChange("statusPengadaan", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELESAI">SELESAI</SelectItem>
                      <SelectItem value="ONGOING">ONGOING</SelectItem>
                      <SelectItem value="Persiapan Pengadaan">Persiapan Pengadaan</SelectItem>
                      <SelectItem value="BATAL">BATAL</SelectItem>
                      <SelectItem value="GAGAL">GAGAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulanSelesai">Bulan Selesai *</Label>
                  <Select value={formData.bulanSelesai} onValueChange={(value) => handleChange("bulanSelesai", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TW I">TW I</SelectItem>
                      <SelectItem value="TW II">TW II</SelectItem>
                      <SelectItem value="TW III">TW III</SelectItem>
                      <SelectItem value="TW IV">TW IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keteranganPengadaan">Keterangan</Label>
                  <Input
                    id="keteranganPengadaan"
                    value={formData.keteranganPengadaan}
                    onChange={(e) => handleChange("keteranganPengadaan", e.target.value)}
                    placeholder="Masukkan keterangan"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: PROSES KONTRAK */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-600">PROSES KONTRAK</h3>
              <Separator />
              
              {/* Nilai / Harga Kontrak + PPN */}
              <div className="space-y-4">
                <h4 className="font-medium">Nilai / Harga Kontrak + PPN</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costSavingRp">Cost Saving (Rp)</Label>
                    <Input
                      id="costSavingRp"
                      type="number"
                      value={formData.costSavingRp}
                      onChange={(e) => handleChange("costSavingRp", e.target.value)}
                      placeholder="Auto calculated"
                      readOnly={formData.statusPengadaan === "SELESAI"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nilaiKontrakRupiah">Rupiah</Label>
                    <Input
                      id="nilaiKontrakRupiah"
                      type="number"
                      value={formData.nilaiKontrakRupiah}
                      onChange={(e) => handleChange("nilaiKontrakRupiah", e.target.value)}
                      placeholder="Masukkan nilai Rupiah"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nilaiKontrakUsd">USD</Label>
                    <Input
                      id="nilaiKontrakUsd"
                      type="number"
                      value={formData.nilaiKontrakUsd}
                      onChange={(e) => handleChange("nilaiKontrakUsd", e.target.value)}
                      placeholder="Masukkan nilai USD"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nilaiKontrakPortiTahun">Porsi tahun berjalan (Rupiah)</Label>
                    <Input
                      id="nilaiKontrakPortiTahun"
                      type="number"
                      value={formData.nilaiKontrakPortiTahun}
                      onChange={(e) => handleChange("nilaiKontrakPortiTahun", e.target.value)}
                      placeholder="Masukkan porsi tahun"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penyediaBarangJasa">Penyedia Barang / Jasa / Konsultan *</Label>
                  <Input
                    id="penyediaBarangJasa"
                    value={formData.penyediaBarangJasa}
                    onChange={(e) => handleChange("penyediaBarangJasa", e.target.value)}
                    placeholder="Masukkan nama penyedia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusPenyedia">Status Penyedia Barang / Jasa / Konsultan (UMKM/Non UMKM) *</Label>
                  <Select value={formData.statusPenyedia} onValueChange={(value) => handleChange("statusPenyedia", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Status Penyedia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UMKM">UMKM</SelectItem>
                      <SelectItem value="Non UMKM">Non UMKM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kontrak / Amandemen */}
              <div className="space-y-4">
                <h4 className="font-medium">Kontrak / Amandemen (terakhir)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kontrakNomor">Nomor *</Label>
                    <Input
                      id="kontrakNomor"
                      value={formData.kontrakNomor}
                      onChange={(e) => handleChange("kontrakNomor", e.target.value)}
                      placeholder="Masukkan nomor kontrak"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kontrakTanggal">Tanggal *</Label>
                    <Input
                      id="kontrakTanggal"
                      type="date"
                      value={formData.kontrakTanggal}
                      onChange={(e) => handleChange("kontrakTanggal", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {pengadaan ? "Simpan Perubahan" : "Tambah Pengadaan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
