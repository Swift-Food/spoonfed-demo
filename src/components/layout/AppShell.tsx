import { Outlet } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import TopBar from './TopBar';
import SideNav from './SideNav';

const BACK_OFFICE_ROLES = ['caterer_admin', 'kitchen', 'driver'];

export default function AppShell() {
  const persona = useStore((s) => s.persona);
  const isBackOffice = BACK_OFFICE_ROLES.includes(persona.role);

  return (
    <div className="min-h-screen bg-eden-cream text-eden-charcoal">
      <TopBar />
      <div className={isBackOffice ? 'flex' : ''}>
        {isBackOffice && <SideNav />}
        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
