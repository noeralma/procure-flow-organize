import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useGetPendingRequests,
  useGetUserPermissions,
  useRespondToRequest,
  useGetPermissionStats,
  useBulkRespondToRequests,
  Permission,
} from '@/services/permission';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter,
  Eye,
  MessageSquare,
  Users,
  BarChart3,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const PermissionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseData, setResponseData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    response: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approved' | 'rejected'>('approved');
  const [bulkResponse, setBulkResponse] = useState('');

  const { toast } = useToast();
  const { data: pendingData, isLoading: pendingLoading } = useGetPendingRequests();
  const { data: allPermissionsData, isLoading: allLoading } = useGetUserPermissions();
  const { data: stats, isLoading: statsLoading } = useGetPermissionStats();
  const respondToRequest = useRespondToRequest();
  const bulkRespondToRequests = useBulkRespondToRequests();

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

  const handleRespond = async () => {
    if (!selectedPermission) return;

    if (responseData.status === 'rejected' && !responseData.response.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan penolakan harus diisi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await respondToRequest.mutateAsync({
        permissionId: selectedPermission.id,
        data: {
          status: responseData.status,
          response: responseData.response.trim() || undefined,
        },
      });

      toast({
        title: 'Berhasil!',
        description: `Permintaan telah ${responseData.status === 'approved' ? 'disetujui' : 'ditolak'}.`,
      });

      setShowResponseDialog(false);
      setSelectedPermission(null);
      setResponseData({ status: 'approved', response: '' });
    } catch (error) {
      toast({
        title: 'Error!',
        description: error instanceof Error ? error.message : 'Gagal merespons permintaan.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkRespond = async () => {
    if (selectedPermissions.length === 0) {
      toast({
        title: 'Error',
        description: 'Pilih setidaknya satu permintaan.',
        variant: 'destructive',
      });
      return;
    }

    if (bulkAction === 'rejected' && !bulkResponse.trim()) {
      toast({
        title: 'Error',
        description: 'Alasan penolakan harus diisi untuk aksi bulk reject.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await bulkRespondToRequests.mutateAsync({
        permissionIds: selectedPermissions,
        status: bulkAction,
        response: bulkResponse.trim() || undefined,
      });

      toast({
        title: 'Berhasil!',
        description: `${result.processed} permintaan telah diproses. ${result.failed > 0 ? `${result.failed} gagal diproses.` : ''}`,
      });

      setShowBulkDialog(false);
      setSelectedPermissions([]);
      setBulkResponse('');
    } catch (error) {
      toast({
        title: 'Error!',
        description: error instanceof Error ? error.message : 'Gagal memproses permintaan bulk.',
        variant: 'destructive',
      });
    }
  };

  const filteredPermissions = (permissions: Permission[]) => {
    return permissions?.filter(permission => {
      const matchesSearch = 
        permission.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.pengadaanId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || permission.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }) || [];
  };

  const handleSelectPermission = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSelectAll = (permissions: Permission[], checked: boolean) => {
    if (checked) {
      const pendingIds = permissions.filter(p => p.status === 'pending').map(p => p.id);
      setSelectedPermissions(pendingIds);
    } else {
      setSelectedPermissions([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Izin</h1>
          <p className="text-gray-600 mt-1">Kelola permintaan izin edit dari pengguna</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Permintaan</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Menunggu</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
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
                  <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
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
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Daftar Permintaan Izin</CardTitle>
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari permintaan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                  <SelectItem value="expired">Kedaluwarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Menunggu Persetujuan</TabsTrigger>
              <TabsTrigger value="all">Semua Permintaan</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {selectedPermissions.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedPermissions.length} permintaan dipilih
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowBulkDialog(true)}
                    className="ml-auto"
                  >
                    Aksi Bulk
                  </Button>
                </div>
              )}

              {pendingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <PermissionTable
                  permissions={filteredPermissions(pendingData?.permissions || [])}
                  onRespond={(permission) => {
                    setSelectedPermission(permission);
                    setShowResponseDialog(true);
                  }}
                  onSelect={handleSelectPermission}
                  onSelectAll={(checked) => handleSelectAll(pendingData?.permissions || [], checked)}
                  selectedPermissions={selectedPermissions}
                  showBulkActions={true}
                />
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <PermissionTable
                  permissions={filteredPermissions(allPermissionsData?.permissions || [])}
                  onRespond={(permission) => {
                    setSelectedPermission(permission);
                    setShowResponseDialog(true);
                  }}
                  showBulkActions={false}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Respons Permintaan Izin</DialogTitle>
            <DialogDescription>
              Berikan respons untuk permintaan izin dari pengguna.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Keputusan</Label>
              <Select
                value={responseData.status}
                onValueChange={(value: 'approved' | 'rejected') =>
                  setResponseData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Setujui</SelectItem>
                  <SelectItem value="rejected">Tolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Catatan {responseData.status === 'rejected' && '*'}
              </Label>
              <Textarea
                placeholder={
                  responseData.status === 'approved'
                    ? 'Catatan tambahan (opsional)...'
                    : 'Jelaskan alasan penolakan...'
                }
                value={responseData.response}
                onChange={(e) =>
                  setResponseData(prev => ({ ...prev, response: e.target.value }))
                }
                rows={3}
                required={responseData.status === 'rejected'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              disabled={respondToRequest.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleRespond}
              disabled={respondToRequest.isPending}
            >
              {respondToRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Kirim Respons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aksi Bulk</DialogTitle>
            <DialogDescription>
              Proses {selectedPermissions.length} permintaan sekaligus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aksi</Label>
              <Select
                value={bulkAction}
                onValueChange={(value: 'approved' | 'rejected') => setBulkAction(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Setujui Semua</SelectItem>
                  <SelectItem value="rejected">Tolak Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Catatan {bulkAction === 'rejected' && '*'}
              </Label>
              <Textarea
                placeholder={
                  bulkAction === 'approved'
                    ? 'Catatan tambahan (opsional)...'
                    : 'Jelaskan alasan penolakan...'
                }
                value={bulkResponse}
                onChange={(e) => setBulkResponse(e.target.value)}
                rows={3}
                required={bulkAction === 'rejected'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={bulkRespondToRequests.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkRespond}
              disabled={bulkRespondToRequests.isPending}
            >
              {bulkRespondToRequests.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Proses {selectedPermissions.length} Permintaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Permission Table Component
interface PermissionTableProps {
  permissions: Permission[];
  onRespond?: (permission: Permission) => void;
  onSelect?: (permissionId: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  selectedPermissions?: string[];
  showBulkActions?: boolean;
}

const PermissionTable: React.FC<PermissionTableProps> = ({
  permissions,
  onRespond,
  onSelect,
  onSelectAll,
  selectedPermissions = [],
  showBulkActions = false,
}) => {
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

  if (permissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p>Tidak ada permintaan izin ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {showBulkActions && (
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    permissions.filter(p => p.status === 'pending').length > 0 &&
                    permissions.filter(p => p.status === 'pending').every(p => selectedPermissions.includes(p.id))
                  }
                  onCheckedChange={(checked) => onSelectAll?.(checked as boolean)}
                />
              </TableHead>
            )}
            <TableHead>Pengguna</TableHead>
            <TableHead>Pengadaan ID</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissions.map((permission) => (
            <TableRow key={permission.id}>
              {showBulkActions && (
                <TableCell>
                  {permission.status === 'pending' && (
                    <Checkbox
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => onSelect?.(permission.id, checked as boolean)}
                    />
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{permission.userId}</span>
                </div>
              </TableCell>
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
                  {format(new Date(permission.requestedAt), 'dd MMM yyyy', { locale: id })}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={permission.reason}>
                  {permission.reason}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {permission.status === 'pending' && onRespond && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRespond(permission)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Respons
                    </Button>
                  )}
                  {permission.adminResponse && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title={permission.adminResponse}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};