import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const Pengaturan: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Konfigurasi aplikasi akan muncul di sini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pengaturan;