import React from 'react';

type Props = {
  activeMenu: string;
  setActiveMenu: (key: string) => void;
};

const items = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pengadaan', label: 'Pengadaan' },
  { key: 'laporan', label: 'Laporan' },
  { key: 'pengaturan', label: 'Pengaturan' },
  { key: 'user-management', label: 'User Management' },
  { key: 'permission-management', label: 'Permission Management' },
  { key: 'my-permissions', label: 'My Permissions' },
];

export const Sidebar: React.FC<Props> = ({ activeMenu, setActiveMenu }) => {
  return (
    <aside className="w-64 border-r bg-background p-4">
      <div className="text-xl font-semibold mb-4">Menu</div>
      <nav className="space-y-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveMenu(item.key)}
            className={`w-full text-left px-3 py-2 rounded ${
              activeMenu === item.key ? 'bg-muted font-medium' : 'hover:bg-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;