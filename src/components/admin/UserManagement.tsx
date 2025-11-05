import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const UserManagement: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fitur manajemen pengguna akan ditambahkan di sini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;