import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useCreatePengadaan, useUpdatePengadaan } from "@/services/pengadaan";

interface PengadaanFormProps {
  onClose: () => void;
  pengadaan?: any;
}

export const PengadaanForm = ({ onClose, pengadaan }: PengadaanFormProps) => {
  const { toast } = useToast();
  const createPengadaan = useCreatePengadaan();
  const updatePengadaan = useUpdatePengadaan();

  const [formData, setFormData] = useState({
    nama: pengadaan?.nama || "",
    kategori: pengadaan?.kategori || "",
    deskripsi: pengadaan?.deskripsi || "",
    vendor: pengadaan?.vendor || "",
    nilai: pengadaan?.nilai || "",
    tanggal: pengadaan?.tanggal || new Date().toISOString().split("T")[0],
    deadline: pengadaan?.deadline || "",
    status: pengadaan?.status || "Draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (pengadaan) {
        await updatePengadaan.mutateAsync({
          ...formData,
          id: pengadaan.id,
        });
        toast({
          title: "Berhasil!",
          description: `Pengadaan "${formData.nama}" telah diperbarui.`,
        });
      } else {
        await createPengadaan.mutateAsync(formData);
        toast({
          title: "Berhasil!",
          description: `Pengadaan "${formData.nama}" telah ditambahkan.`,
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">
            {pengadaan ? "Edit Pengadaan" : "Tambah Pengadaan Baru"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Pengadaan</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => handleChange("nama", e.target.value)}
                  placeholder="Masukkan nama pengadaan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => handleChange("kategori", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Barang">Barang</SelectItem>
                    <SelectItem value="Jasa">Jasa</SelectItem>
                    <SelectItem value="Konstruksi">Konstruksi</SelectItem>
                    <SelectItem value="Konsultansi">Konsultansi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) => handleChange("deskripsi", e.target.value)}
                placeholder="Masukkan deskripsi pengadaan"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => handleChange("vendor", e.target.value)}
                  placeholder="Masukkan nama vendor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nilai">Nilai Pengadaan</Label>
                <Input
                  id="nilai"
                  value={formData.nilai}
                  onChange={(e) => handleChange("nilai", e.target.value)}
                  placeholder="Masukkan nilai pengadaan"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal Mulai</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => handleChange("tanggal", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Penawaran">Penawaran</SelectItem>
                  <SelectItem value="Proses Evaluasi">
                    Proses Evaluasi
                  </SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
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
