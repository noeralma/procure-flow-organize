import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const API_BASE_URL = 'http://localhost:3001/api';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Network error while fetching users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setActionLoading('create');
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        setFormErrors({ general: data.message || 'Failed to create user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setFormErrors({ general: 'Network error while creating user' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setActionLoading(`role-${userId}`);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User role updated successfully',
        });
        fetchUsers();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.message || 'Failed to update user role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Network error while updating user role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      setActionLoading(`status-${userId}`);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/auth/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User status updated successfully',
        });
        fetchUsers();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.message || 'Failed to update user status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'Network error while updating user status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setFormErrors({});
    setEditingUser(null);
  };

  const getUserInitials = (username: string): string => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access user management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with specified role and permissions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {formErrors.general && (
                  <Alert variant="destructive">
                    <AlertDescription>{formErrors.general}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: 'user' | 'admin') => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={actionLoading === 'create'}>
                  {actionLoading === 'create' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getUserInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.username}</p>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: 'user' | 'admin') => handleUpdateUserRole(user.id, value)}
                        disabled={user.id === currentUser?.id || actionLoading === `role-${user.id}`}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-2" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-2" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.status}
                        onValueChange={(value: 'active' | 'inactive') => handleUpdateUserStatus(user.id, value)}
                        disabled={user.id === currentUser?.id || actionLoading === `status-${user.id}`}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <Badge variant="default" className="text-xs">Active</Badge>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {(actionLoading === `role-${user.id}` || actionLoading === `status-${user.id}`) && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};