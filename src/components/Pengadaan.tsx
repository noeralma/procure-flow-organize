
import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PengadaanForm } from "./PengadaanForm";

export const Pengadaan = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPengadaan, setSelectedPengadaan] = useState(null);

  const pengadaanData = [
    {
      id: "PGD-001",
      nama: "Pengadaan Laptop Dell Latitude 5520",
      kategori: "Barang",
      vendor: "PT. Tech Solutions",
      nilai: "Rp 45.000.000",
      status: "Proses Evaluasi",
      tanggal: "2024-01-15",
      deadline: "2024-01-30"
    },
    {
      id: "PGD-002", 
      nama: "Jasa Cleaning Service Gedung A",
      kategori: "Jasa",
      vendor: "CV. Bersih Selalu",
      nilai: "Rp 12.000.000",
      status: "Selesai",
      tanggal: "2024-01-10",
      deadline: "2024-01-25"
    },
    {
      id: "PGD-003",
      nama: "Pengadaan Furniture Kantor",
      kategori: "Barang",
      vendor: "PT. Mebel Jaya",
      nilai: "Rp 25.000.000", 
      status: "Penawaran",
      tanggal: "2024-01-20",
      deadline: "2024-02-05"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Selesai":
        return "bg-green-100 text-green-800";
      case "Proses Evaluasi":
        return "bg-orange-100 text-orange-800";
      case "Penawaran":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredData = pengadaanData.filter(item =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengadaan</h1>
          <p className="text-gray-600 mt-1">Kelola data pengadaan barang dan jasa</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengadaan
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari pengadaan atau vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Daftar Pengadaan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nama Pengadaan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Kategori</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nilai</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Deadline</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono text-sm text-blue-600">{item.id}</td>
                    <td className="py-4 px-4 font-medium text-gray-900">{item.nama}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {item.kategori}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{item.vendor}</td>
                    <td className="py-4 px-4 font-semibold text-green-600">{item.nilai}</td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{item.deadline}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="p-2">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="p-2 text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <PengadaanForm 
          onClose={() => setShowForm(false)}
          pengadaan={selectedPengadaan}
        />
      )}
    </div>
  );
};
