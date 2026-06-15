import EdenLogo from '../common/EdenLogo';
import NotificationBell from './NotificationBell';
import PersonaSwitcher from './PersonaSwitcher';

export default function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-eden-sage/40 bg-white px-4 py-3 md:px-8">
      <EdenLogo />
      <div className="flex items-center gap-4">
        <NotificationBell />
        <PersonaSwitcher />
      </div>
    </header>
  );
}
