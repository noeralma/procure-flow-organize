
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Settings,
  Building2,
  User,
  LogOut,
  Shield,
  Key,
  UserCheck
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export const Sidebar = ({ activeMenu, setActiveMenu }: SidebarProps) => {
  const { user, logout } = useAuth();
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pengadaan", label: "Pengadaan", icon: ShoppingCart },
    { id: "laporan", label: "Laporan", icon: FileText },
    { id: "pengaturan", label: "Pengaturan", icon: Settings },
  ];

  // Add admin-only menu items
  if (user?.role === 'admin') {
    menuItems.push({
      id: "user-management",
      label: "User Management",
      icon: Shield
    });
    menuItems.push({
      id: "permission-management",
      label: "Permission Management",
      icon: Key
    });
  }

  // Add permission menu for regular users
  if (user?.role !== 'admin') {
    menuItems.push({
      id: "my-permissions",
      label: "My Permissions",
      icon: UserCheck
    });
  }

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (username: string): string => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-64 bg-sidebar shadow-lg border-r border-sidebar-border flex flex-col h-full">
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
      
      <nav className="mt-6 flex-1">
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

      {/* User Profile Section */}
      <div className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <div className="flex items-center space-x-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user ? getUserInitials(user.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    {user?.username || 'User'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={user?.role === 'admin' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user?.role || 'user'}
                    </Badge>
                    <Badge 
                      variant={user?.status === 'active' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {user?.status || 'inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveMenu('profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveMenu('pengaturan')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
