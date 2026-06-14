import { Bell } from 'lucide-react';
import { useStore } from '../../store/useStore';
import EdenLogo from '../common/EdenLogo';
import PersonaSwitcher from './PersonaSwitcher';

export default function TopBar() {
  const notifications = useStore((s) => s.notifications);
  const persona = useStore((s) => s.persona);
  const unread = notifications.filter((n) => n.recipientRole === persona.role && !n.read).length;

  return (
    <header className="flex items-center justify-between border-b border-eden-sage/40 bg-white px-4 py-3 md:px-8">
      <EdenLogo />
      <div className="flex items-center gap-4">
        <button type="button" aria-label="Notifications" className="relative text-eden-green">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-eden-berry text-[10px] font-bold text-eden-cream">
              {unread}
            </span>
          )}
        </button>
        <PersonaSwitcher />
      </div>
    </header>
  );
}
