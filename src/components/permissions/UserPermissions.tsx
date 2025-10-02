import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetUserPermissions, useRevokePermission, Permission } from '@/services/permission';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Trash2,
  Calendar,
  MessageSquare,
  Loader2,
  FileText,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const UserPermissions: React.FC = () => {
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const { toast } = useToast();
  const { data: permissionsData, isLoading } = useGetUserPermissions();
  const revokePermission = useRevokePermission();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Menunggu' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Disetujui' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Ditolak' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Kedaluwarsa' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPermissionTypeBadge = (type: string) => {
    const typeConfig = {
      edit_form: { color: 'bg-blue-100 text-blue-800', label: 'Edit Form' },
      delete_form: { color: 'bg-red-100 text-red-800', label: 'Hapus Form' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.edit_form;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleRevoke = async () => {
    if (!selectedPermission) return;

    try {
      await revokePermission.mutateAsync(selectedPermission.id);
      
      toast({
        title: 'Berhasil!',
        description: 'Permintaan izin telah dibatalkan.',
      });

      setShowRevokeDialog(false);
      setSelectedPermission(null);
    } catch (error) {
      toast({
        title: 'Error!',
        description: error instanceof Error ? error.message : 'Gagal membatalkan permintaan.',
        variant: 'destructive',
      });
    }
  };

  const canRevoke = (permission: Permission) => {
    return permission.status === 'pending';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const permissions = permissionsData?.permissions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Permintaan Izin Saya</h2>
        <p className="text-gray-600 mt-1">Kelola permintaan izin edit yang telah Anda ajukan</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Menunggu</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {permissions.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disetujui</p>
                <p className="text-2xl font-bold text-green-600">
                  {permissions.filter(p => p.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ditolak</p>
                <p className="text-2xl font-bold text-red-600">
                  {permissions.filter(p => p.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Permintaan</CardTitle>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Anda belum memiliki permintaan izin.</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengadaan ID</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Permintaan</TableHead>
                    <TableHead>Tanggal Respons</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {permission.pengadaanId}
                        </code>
                      </TableCell>
                      <TableCell>{getPermissionTypeBadge(permission.permissionType)}</TableCell>
                      <TableCell>{getStatusBadge(permission.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(permission.requestedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {permission.respondedAt ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(permission.respondedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPermission(permission);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Detail
                          </Button>
                          {canRevoke(permission) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPermission(permission);
                                setShowRevokeDialog(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Batalkan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Permintaan Izin</DialogTitle>
          </DialogHeader>

          {selectedPermission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pengadaan ID</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {selectedPermission.pengadaanId}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Jenis Izin</p>
                  <div className="mt-1">
                    {getPermissionTypeBadge(selectedPermission.permissionType)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedPermission.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Tanggal Permintaan</p>
                  <p className="text-sm">
                    {format(new Date(selectedPermission.requestedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Alasan Permintaan</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{selectedPermission.reason}</p>
                </div>
              </div>

              {selectedPermission.adminResponse && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Respons Admin</p>
                  <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm">{selectedPermission.adminResponse}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPermission.respondedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Tanggal Respons</p>
                  <p className="text-sm">
                    {format(new Date(selectedPermission.respondedAt), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              )}

              {selectedPermission.expiresAt && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Kedaluwarsa</p>
                  <p className="text-sm">
                    {format(new Date(selectedPermission.expiresAt), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Batalkan Permintaan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin membatalkan permintaan izin ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevokeDialog(false)}
              disabled={revokePermission.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revokePermission.isPending}
            >
              {revokePermission.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};