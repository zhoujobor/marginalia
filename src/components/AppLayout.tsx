import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { CommandPalette } from '@/components/CommandPalette';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useStore } from '@/store/useStore';

export function AppLayout() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      <CommandPalette />
      <InstallPrompt />
    </div>
  );
}
