import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ringkasan aktivitas dan statistik akan tampil di sini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;