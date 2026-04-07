import { useLocation }       from 'react-router-dom';
import { Menu }                from 'lucide-react';
import { useAuthStore }        from '../../store/authStore.js';
import NotificationBell        from '../notifications/NotificationBell.jsx';
import { cn }                  from '../../lib/utils.js';
import ThemeToggle             from '../ui/ThemeToggle.jsx';

const PAGE_TITLES = {
  '/dashboard':     'Tableau de bord',
  '/groups':        'Mes groupes',
  '/contributions': 'Contributions',
  '/profile':       'Mon profil',
};

export default function Topbar({ sidebarCollapsed, onMobileMenuToggle }) {
  const location = useLocation();
  const user     = useAuthStore((s) => s.user);

  // Titre dynamique selon la route active
  const title = Object.entries(PAGE_TITLES).find(
    ([path]) => location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'TontiTrack';

  const marginLeft = sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64';

  return (
    <header className={cn(
      'fixed top-0 right-0 z-20 h-16',
      'left-0', marginLeft,
      'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
      'border-b border-gray-100 dark:border-gray-800',
      'flex items-center justify-between px-6',
      'transition-all duration-200'
    )}>
      <div className="flex items-center gap-4">
        {/* Bouton menu mobile */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu size={18} />
        </button>

        <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Cloche avec panneau et badge */}
        <NotificationBell />

        <div className="ml-auto">
          <ThemeToggle className="text-gray-400" />
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
        </div>
      </div>
    </header>
  );
}