import { useEffect, useRef }                   from 'react';
import { useNavigate }                          from 'react-router-dom';
import { Bell, CheckCheck, Inbox }              from 'lucide-react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications.js';
import Spinner  from '../ui/Spinner.jsx';
import Button   from '../ui/Button.jsx';
import { NOTIF_CONFIG } from '../../lib/notificationConfig.js';
import { cn }   from '../../lib/utils.js';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins  < 1)  return 'À l\'instant';
  if (mins  < 60) return `Il y a ${mins} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${days}j`;
}

function NotifItem({ notif, onRead }) {
  const navigate = useNavigate();
  const cfg      = NOTIF_CONFIG[notif.type] ?? NOTIF_CONFIG.payment_reminder;
  const Icon     = cfg.icon;

  function handleClick() {
    if (!notif.read) onRead(notif._id);
    if (notif.link)  navigate(notif.link);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
        !notif.read && 'bg-primary-50/40 dark:bg-primary-500/5'
      )}
    >
      {/* Icône */}
      <div className={cn('p-2 rounded-lg flex-shrink-0 mt-0.5', cfg.bg)}>
        <Icon size={14} className={cfg.color} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm leading-snug',
            notif.read
              ? 'text-gray-600 dark:text-gray-300'
              : 'text-gray-800 dark:text-gray-100 font-medium'
          )}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>
        <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1.5">
          {timeAgo(notif.createdAt)}
        </p>
      </div>
    </button>
  );
}

export default function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const { data, isLoading } = useNotifications({ limit: 20 });
  const { mutate: markRead }    = useMarkAsRead();
  const { mutate: markAll, isPending: markingAll } = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount   ?? 0;

  // Fermer au clic hors du panneau
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute right-0 top-full left-1/2 -translate-x-2/3 md:left-auto md:translate-x-0 mt-2 z-50',
        'md:w-96 w-80 max-h-[560px] flex flex-col',
        'bg-white dark:bg-gray-900',
        'border border-gray-100 dark:border-gray-800',
        'rounded-2xl shadow-modal',
        'transition-all duration-200 ease-in-out',
        'animate-fade-in overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-500 text-white min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            loading={markingAll}
            onClick={() => markAll()}
            leftIcon={<CheckCheck size={13} />}
          >
            Tout lire
          </Button>
        )}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/50">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="text-primary-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
              <Inbox size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Aucune notification
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Vous serez notifié des paiements et rappels ici.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotifItem
              key={notif._id}
              notif={notif}
              onRead={(id) => markRead(id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            {data?.pagination?.total ?? 0} notification{(data?.pagination?.total ?? 0) > 1 ? 's' : ''} au total
          </p>
        </div>
      )}
    </div>
  );
}