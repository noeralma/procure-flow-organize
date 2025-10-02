import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRequestPermission } from '@/services/permission';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface PermissionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengadaanId: string;
  pengadaanName?: string;
}

export const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  open,
  onOpenChange,
  pengadaanId,
  pengadaanName,
}) => {
  const [formData, setFormData] = useState({
    permissionType: 'edit_form' as 'edit_form' | 'delete_form',
    reason: '',
  });

  const { toast } = useToast();
  const requestPermission = useRequestPermission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan permisi harus diisi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await requestPermission.mutateAsync({
        pengadaanId,
        permissionType: formData.permissionType,
        reason: formData.reason.trim(),
      });

      toast({
        title: 'Berhasil!',
        description: 'Permintaan izin edit telah dikirim dan menunggu persetujuan admin.',
      });

      // Reset form and close dialog
      setFormData({
        permissionType: 'edit_form',
        reason: '',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error!',
        description: error instanceof Error ? error.message : 'Gagal mengirim permintaan izin.',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Minta Izin Edit</DialogTitle>
          <DialogDescription>
            Kirim permintaan izin untuk mengedit {pengadaanName ? `"${pengadaanName}"` : 'pengadaan ini'}.
            Admin akan meninjau permintaan Anda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="permissionType">Jenis Izin</Label>
            <Select
              value={formData.permissionType}
              onValueChange={(value) => handleChange('permissionType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis izin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit_form">Edit Form</SelectItem>
                <SelectItem value="delete_form">Hapus Form</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Permintaan *</Label>
            <Textarea
              id="reason"
              placeholder="Jelaskan alasan Anda memerlukan izin edit..."
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.reason.length}/500 karakter
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={requestPermission.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={requestPermission.isPending || !formData.reason.trim()}
            >
              {requestPermission.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kirim Permintaan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};