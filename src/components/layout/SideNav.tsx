import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, ChefHat, Truck, BookOpen, Users, Receipt, BarChart2 } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { to: '/admin/production', label: 'Production', icon: ChefHat },
  { to: '/admin/delivery', label: 'Delivery', icon: Truck },
  { to: '/admin/menus', label: 'Menus', icon: BookOpen },
  { to: '/admin/accounts', label: 'Accounts', icon: Users },
  { to: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function SideNav() {
  return (
    <nav className="hidden w-56 flex-col gap-1 bg-eden-green px-3 py-6 text-eden-cream md:flex">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/admin'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-eden-leaf text-eden-cream' : 'text-eden-sage hover:bg-eden-leaf/30 hover:text-eden-cream'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
