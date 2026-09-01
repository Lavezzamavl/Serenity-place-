import { useState, useEffect, useRef } from 'react';
import { LogOut, Bell } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';

export default function Topbar({ user, onLogout, moduleLabel }) {
  const displayName = (user.first_name || user.last_name)
    ? `${user.first_name} ${user.last_name}`.trim()
    : user.username;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const refresh = () => getNotifications().then(setNotifications).catch(() => {});

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => setOpen((prev) => !prev);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // silently ignore - not critical if this fails
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silently ignore
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h2 className="font-display text-lg font-medium text-harbor">
        {moduleLabel}
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative" ref={panelRef}>
          <button onClick={handleOpen} className="relative text-slate hover:text-harbor transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-sage rounded-full" />
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-medium text-harbor">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-serenity hover:text-harbor">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 && (
                  <p className="px-4 py-6 text-sm text-slate/50 text-center">You're all caught up.</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-mist/50 transition-colors ${n.is_read ? 'opacity-60' : ''}`}
                  >
                    <p className="text-xs font-medium text-serenity uppercase tracking-wide mb-0.5">
                      {n.category.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-harbor">{n.message}</p>
                    <p className="text-xs text-slate/50 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-serenity text-white flex items-center justify-center text-sm font-medium">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-harbor">{displayName}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate hover:text-red-500 transition-colors ml-2"
            title="Sign out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}