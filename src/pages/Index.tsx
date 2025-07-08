
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { Pengadaan } from "@/components/Pengadaan";
import { Laporan } from "@/components/Laporan";
import { Pengaturan } from "@/components/Pengaturan";

const Index = () => {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "pengadaan":
        return <Pengadaan />;
      case "laporan":
        return <Laporan />;
      case "pengaturan":
        return <Pengaturan />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="flex-1 p-6 bg-background">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
