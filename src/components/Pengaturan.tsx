
import { useState } from "react";
import { Save, User, Building, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export const Pengaturan = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Profile Settings
    namaPerusahaan: "PT. Contoh Perusahaan",
    alamat: "Jl. Contoh No. 123, Jakarta",
    telepon: "+62-21-12345678",
    email: "admin@contoh.com",
    
    // Notification Settings
    emailNotifikasi: true,
    smsNotifikasi: false,
    notifikasiDeadline: true,
    notifikasiStatus: true,
    
    // System Settings
    autoBackup: true,
    retentionData: "12", // months
    timezone: "Asia/Jakarta"
  });

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings:`, settings);
    toast({
      title: "Berhasil!",
      description: `Pengaturan ${section} telah disimpan.`,
    });
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-600 mt-1">Kelola konfigurasi aplikasi dan preferensi</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Keamanan
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Sistem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Informasi Perusahaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaPerusahaan">Nama Perusahaan</Label>
                  <Input
                    id="namaPerusahaan"
                    value={settings.namaPerusahaan}
                    onChange={(e) => handleChange('namaPerusahaan', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea
                  id="alamat"
                  value={settings.alamat}
                  onChange={(e) => handleChange('alamat', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  value={settings.telepon}
                  onChange={(e) => handleChange('telepon', e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSave('profil')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-600" />
                Preferensi Notifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifikasi Email</h3>
                  <p className="text-sm text-gray-600">Terima notifikasi melalui email</p>
                </div>
                <Switch
                  checked={settings.emailNotifikasi}
                  onCheckedChange={(checked) => handleChange('emailNotifikasi', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifikasi SMS</h3>
                  <p className="text-sm text-gray-600">Terima notifikasi melalui SMS</p>
                </div>
                <Switch
                  checked={settings.smsNotifikasi}
                  onCheckedChange={(checked) => handleChange('smsNotifikasi', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Peringatan Deadline</h3>
                  <p className="text-sm text-gray-600">Notifikasi ketika mendekati deadline</p>
                </div>
                <Switch
                  checked={settings.notifikasiDeadline}
                  onCheckedChange={(checked) => handleChange('notifikasiDeadline', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Update Status</h3>
                  <p className="text-sm text-gray-600">Notifikasi perubahan status pengadaan</p>
                </div>
                <Switch
                  checked={settings.notifikasiStatus}
                  onCheckedChange={(checked) => handleChange('notifikasiStatus', checked)}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSave('notifikasi')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Pengaturan Keamanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Password Saat Ini</Label>
                <Input id="currentPassword" type="password" placeholder="Masukkan password saat ini" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <Input id="newPassword" type="password" placeholder="Masukkan password baru" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                <Input id="confirmPassword" type="password" placeholder="Konfirmasi password baru" />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800">Tips Keamanan:</h3>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Gunakan kombinasi huruf besar, kecil, angka, dan simbol</li>
                  <li>• Minimal 8 karakter</li>
                  <li>• Jangan gunakan informasi pribadi</li>
                  <li>• Ganti password secara berkala</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSave('keamanan')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Pengaturan Sistem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto Backup</h3>
                  <p className="text-sm text-gray-600">Backup otomatis data sistem</p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => handleChange('autoBackup', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retentionData">Retensi Data (Bulan)</Label>
                <Input
                  id="retentionData"
                  type="number"
                  value={settings.retentionData}
                  onChange={(e) => handleChange('retentionData', e.target.value)}
                />
                <p className="text-sm text-gray-600">Data akan dihapus otomatis setelah periode ini</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Waktu</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  readOnly
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800">Informasi Sistem:</h3>
                <div className="text-sm text-blue-700 mt-2 space-y-1">
                  <div>Versi Aplikasi: 1.0.0</div>
                  <div>Database: PostgreSQL</div>
                  <div>Last Backup: 26 Mei 2025, 08:00</div>
                  <div>Storage Used: 2.4 GB / 10 GB</div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => handleSave('sistem')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
