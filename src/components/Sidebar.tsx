
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Settings,
  Building2
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export const Sidebar = ({ activeMenu, setActiveMenu }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pengadaan", label: "Pengadaan", icon: ShoppingCart },
    { id: "laporan", label: "Laporan", icon: FileText },
    { id: "pengaturan", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">ProcureApp</h1>
              <p className="text-sm text-sidebar-foreground/70">Pengadaan B&J</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent border-r-4 border-sidebar-primary text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-sidebar-primary" : ""}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
