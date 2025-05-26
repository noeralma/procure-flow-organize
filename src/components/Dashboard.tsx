
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Dashboard = () => {
  const stats = [
    {
      title: "Total Pengadaan",
      value: "156",
      change: "+12%",
      icon: Package,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Nilai Kontrak",
      value: "Rp 2.4M",
      change: "+8%",
      icon: DollarSign,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Proses Berjalan",
      value: "23",
      change: "-5%",
      icon: Clock,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Selesai Bulan Ini",
      value: "45",
      change: "+15%",
      icon: CheckCircle,
      color: "from-purple-500 to-purple-600"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: "Pengadaan Laptop Dell Latitude",
      status: "Proses Evaluasi",
      date: "2 jam lalu",
      value: "Rp 45.000.000",
      statusColor: "text-orange-600 bg-orange-100"
    },
    {
      id: 2,
      title: "Pengadaan Furniture Kantor",
      status: "Selesai",
      date: "1 hari lalu", 
      value: "Rp 25.000.000",
      statusColor: "text-green-600 bg-green-100"
    },
    {
      id: 3,
      title: "Jasa Cleaning Service",
      status: "Penawaran",
      date: "3 hari lalu",
      value: "Rp 12.000.000",
      statusColor: "text-blue-600 bg-blue-100"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard Pengadaan</h1>
        <p className="text-blue-100">Selamat datang! Kelola pengadaan barang dan jasa dengan mudah</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{activity.title}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.statusColor}`}>
                      {activity.status}
                    </span>
                    <span className="text-sm text-gray-500">{activity.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{activity.value}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
              Perhatian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-medium text-orange-900">5 Pengadaan Mendekati Deadline</h3>
              <p className="text-sm text-orange-700 mt-1">Segera selesaikan evaluasi untuk pengadaan yang akan berakhir minggu ini</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900">Update Regulasi Terbaru</h3>
              <p className="text-sm text-blue-700 mt-1">Peraturan pengadaan terbaru telah diupdate, silakan review di menu pengaturan</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-900">Laporan Bulanan Siap</h3>
              <p className="text-sm text-green-700 mt-1">Laporan pengadaan bulan November sudah dapat diunduh</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
