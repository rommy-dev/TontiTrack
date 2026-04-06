import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils.js';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';
import MobileDrawer from './MobileDrawer';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const marginLeft = collapsed ? 'lg:ml-16' : 'lg:ml-64';

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        className="hidden lg:block"
      />
      <Topbar 
        sidebarCollapsed={collapsed} 
        onMobileMenuToggle={handleMobileMenuToggle} 
      />

      <MobileDrawer 
        isOpen={mobileMenuOpen} 
        onClose={handleMobileMenuClose} 
      />

      <main className={cn(
        'pt-16 min-h-screen transition-all duration-200',
        marginLeft
      )}>
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}