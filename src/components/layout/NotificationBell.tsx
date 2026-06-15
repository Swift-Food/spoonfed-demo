import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store/useStore';
import type { Role } from '../../lib/types';
import Toast from '../common/Toast';

const ZERO_COUNTS: Record<Role, number> = {
  orderer: 0,
  approver: 0,
  caterer_admin: 0,
  kitchen: 0,
  driver: 0,
};

function countsByRole(notifications: { recipientRole: Role }[]): Record<Role, number> {
  const counts = { ...ZERO_COUNTS };
  for (const n of notifications) counts[n.recipientRole] += 1;
  return counts;
}

function routeForRole(role: Role, orderId: string): string | null {
  switch (role) {
    case 'orderer':
      return `/orders/${orderId}`;
    case 'approver':
      return `/approvals/${orderId}`;
    case 'caterer_admin':
      return `/admin/orders/${orderId}`;
    default:
      return null;
  }
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const notifications = useStore((s) => s.notifications);
  const persona = useStore((s) => s.persona);
  const markRead = useStore((s) => s.markRead);

  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<Record<Role, number> | null>(null);

  if (lastSeenRef.current === null) {
    lastSeenRef.current = countsByRole(notifications);
  }

  useEffect(() => {
    const lastSeen = lastSeenRef.current!;
    const counts = countsByRole(notifications);
    const role = persona.role;

    if (counts[role] > (lastSeen[role] ?? 0)) {
      const mine = notifications.filter((n) => n.recipientRole === role);
      const newest = mine[mine.length - 1];
      setToastMessage(newest.message);
      lastSeenRef.current = { ...lastSeen, [role]: counts[role] };
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notifications, persona.role]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const feed = notifications
    .filter((n) => n.recipientRole === persona.role)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = feed.filter((n) => !n.read).length;

  const handleSelect = (notificationId: string, orderId: string) => {
    markRead(notificationId);
    setOpen(false);
    const route = routeForRole(persona.role, orderId);
    if (route) navigate(route);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative text-eden-green"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-eden-berry text-[10px] font-bold text-eden-cream">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-eden-sage/40 bg-white shadow-lg">
          <div className="border-b border-eden-sage/30 px-4 py-2">
            <h3 className="font-serif text-base text-eden-green">Notifications</h3>
          </div>
          {feed.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-eden-stone">Nothing yet.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-eden-sage/30 overflow-y-auto">
              {feed.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(n.id, n.orderId)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm hover:bg-eden-cream ${
                      n.read ? 'text-eden-stone' : 'text-eden-charcoal font-medium'
                    }`}
                  >
                    <span>{n.message}</span>
                    <span className="text-xs text-eden-stone">{format(parseISO(n.createdAt), 'd MMM, HH:mm')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toastMessage && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80">
          <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        </div>
      )}
    </div>
  );
}
