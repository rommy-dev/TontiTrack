import { useState }          from 'react';
import { Bell }              from 'lucide-react';
import { useUnreadCount }    from '../../hooks/useNotifications.js';
import NotificationPanel     from './NotificationPanel.jsx';
import { cn }                from '../../lib/utils.js';

export default function NotificationBell() {
  const [open, setOpen]   = useState(false);
  const { data: count }   = useUnreadCount();
  const hasUnread         = (count ?? 0) > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-gray-400 dark:text-gray-500',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'hover:text-gray-600 dark:hover:text-gray-300',
          open && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
        )}
      >
        <Bell size={18} />

        {/* Badge nombre non-lus */}
        {hasUnread && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5',
            'flex items-center justify-center',
            'min-w-[18px] h-[18px] px-1',
            'rounded-full text-[10px] font-bold',
            'bg-danger-500 text-white',
            'animate-bounce-once'
          )}>
            {count > 99 ? '99+' : count}
          </span>
        )}

        {/* Pulse ring quand non-lus */}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] w-[18px] pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-30" />
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel onClose={() => setOpen(false)} />
      )}
    </div>
  );
}