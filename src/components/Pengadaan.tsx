import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PengadaanForm } from "./PengadaanForm";
import { PengadaanDetail } from "./PengadaanDetail";
import { useGetPengadaan, useDeletePengadaan } from "@/services/pengadaan";
import { useToast } from "@/hooks/use-toast";

export const Pengadaan = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPengadaan, setSelectedPengadaan] = useState<any>(null);
  const { toast } = useToast();

  const { data: pengadaanData = [] } = useGetPengadaan();
  const deletePengadaan = useDeletePengadaan();

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

  const handleEdit = (pengadaan: any) => {
    setSelectedPengadaan(pengadaan);
    setShowForm(true);
  };

  const handleViewDetail = (pengadaan: any) => {
    setSelectedPengadaan(pengadaan);
    setShowDetail(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengadaan ini?")) {
      try {
        await deletePengadaan.mutateAsync(id);
        toast({
          title: "Berhasil!",
          description: "Pengadaan telah dihapus.",
        });
      } catch (error) {
        toast({
          title: "Error!",
          description: "Gagal menghapus pengadaan.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredData = pengadaanData.filter(
    (item: any) =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedPengadaan(null);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedPengadaan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Pengadaan
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola data pengadaan barang dan jasa
          </p>
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
      <div className="grid gap-4">
        {filteredData.map((item: any) => (
          <Card
            key={item.id}
            className="border-0 shadow hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{item.nama}</h3>
                    <Badge variant="outline">{item.kategori}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.vendor}</p>
                  <p className="text-sm font-medium">{item.nilai}</p>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(item)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <PengadaanForm
          onClose={handleCloseForm}
          pengadaan={selectedPengadaan}
        />
      )}

      {showDetail && (
        <PengadaanDetail
          onClose={handleCloseDetail}
          pengadaan={selectedPengadaan}
        />
      )}
    </div>
  );
};
