import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';

export default function Dashboard() {
  const orders = useStore((s) => s.orders);
  const invoices = useStore((s) => s.invoices);

  const today = format(new Date(), 'yyyy-MM-dd');

  const tiles = [
    {
      label: 'Needs confirmation',
      count: orders.filter((o) => o.status === 'submitted').length,
      to: '/admin/calendar',
    },
    {
      label: "Today's deliveries",
      count: orders.filter((o) => o.eventDate === today && !['draft', 'pending_approval', 'cancelled'].includes(o.status)).length,
      to: '/admin/delivery',
    },
    {
      label: 'Pending approvals',
      count: orders.filter((o) => o.status === 'pending_approval').length,
      to: '/admin/calendar',
    },
    {
      label: 'Unpaid invoices',
      count: invoices.filter((i) => i.status !== 'paid').length,
      to: '/admin/invoices',
    },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">Dashboard</h1>
      <p className="mt-1 text-sm text-eden-stone">Fresh, seasonal, sustainable catering since 1993.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm transition-colors hover:border-eden-leaf hover:shadow"
          >
            <p className="font-serif text-4xl text-eden-green">{tile.count}</p>
            <p className="mt-1 text-sm text-eden-stone">{tile.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
