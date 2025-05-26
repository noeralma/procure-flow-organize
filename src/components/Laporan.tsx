
import { useState } from "react";
import { Download, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Laporan = () => {
  const [filterPeriod, setFilterPeriod] = useState("bulan_ini");
  const [filterKategori, setFilterKategori] = useState("semua");

  const laporanData = {
    summary: {
      totalPengadaan: 156,
      nilaiTotal: "Rp 2.4M",
      avgPengadaan: "Rp 15.4K",
      tingkatKeberhasilan: "94%"
    },
    byCategory: [
      { kategori: "Barang", jumlah: 45, nilai: "Rp 1.2M" },
      { kategori: "Jasa", jumlah: 67, nilai: "Rp 800K" },
      { kategori: "Konstruksi", jumlah: 23, nilai: "Rp 300K" },
      { kategori: "Konsultansi", jumlah: 21, nilai: "Rp 100K" }
    ],
    byStatus: [
      { status: "Selesai", jumlah: 89, persentase: 57 },
      { status: "Proses Evaluasi", jumlah: 34, persentase: 22 },
      { status: "Penawaran", jumlah: 23, persentase: 15 },
      { status: "Draft", jumlah: 10, persentase: 6 }
    ]
  };

  const handleExportReport = (format: string) => {
    console.log(`Exporting report in ${format} format`);
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `laporan_pengadaan_${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Pengadaan</h1>
          <p className="text-gray-600 mt-1">Analisis dan laporan data pengadaan</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleExportReport('pdf')}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExportReport('xlsx')}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari_ini">Hari Ini</SelectItem>
                  <SelectItem value="minggu_ini">Minggu Ini</SelectItem>
                  <SelectItem value="bulan_ini">Bulan Ini</SelectItem>
                  <SelectItem value="tahun_ini">Tahun Ini</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  <SelectItem value="barang">Barang</SelectItem>
                  <SelectItem value="jasa">Jasa</SelectItem>
                  <SelectItem value="konstruksi">Konstruksi</SelectItem>
                  <SelectItem value="konsultansi">Konsultansi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Pengadaan</p>
                <p className="text-3xl font-bold">{laporanData.summary.totalPengadaan}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Nilai Total</p>
                <p className="text-3xl font-bold">{laporanData.summary.nilaiTotal}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Rata-rata</p>
                <p className="text-3xl font-bold">{laporanData.summary.avgPengadaan}</p>
              </div>
              <PieChart className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Tingkat Berhasil</p>
                <p className="text-3xl font-bold">{laporanData.summary.tingkatKeberhasilan}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Pengadaan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {laporanData.byCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="font-medium">{item.kategori}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.jumlah} item</div>
                    <div className="text-sm text-gray-600">{item.nilai}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Status Pengadaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {laporanData.byStatus.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{item.status}</span>
                    <span className="text-sm text-gray-600">{item.jumlah} ({item.persentase}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' :
                        index === 1 ? 'bg-orange-500' :
                        index === 2 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${item.persentase}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
