import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Order } from '../../lib/types';
import { formatFriendlyDate } from '../../lib/dates';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import Table from '../../components/common/Table';
import Money from '../../components/common/Money';

export default function MyOrders() {
  const orders = useStore((s) => s.orders);
  const persona = useStore((s) => s.persona);

  const myOrders = orders
    .filter((o) => o.placedByContactId === persona.contactId && !o.isQuote)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">My orders</h1>

      {myOrders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ClipboardList size={32} />}
            title="No orders yet"
            description="Once you place an order, you'll be able to track it here."
            action={
              <Link
                to="/order"
                className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
              >
                Start an order
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6">
          <Table<Order>
            rows={myOrders}
            columns={[
              { header: 'Order #', render: (o) => o.orderNumber },
              { header: 'Event date', render: (o) => formatFriendlyDate(o.eventDate) },
              { header: 'Status', render: (o) => <StatusChip status={o.status} /> },
              { header: 'Total', render: (o) => <Money amount={o.total} /> },
              {
                header: '',
                render: (o) => (
                  <Link to={`/orders/${o.id}`} className="font-medium text-eden-green hover:text-eden-leaf">
                    View
                  </Link>
                ),
                className: 'text-right',
              },
            ]}
            rowKey={(o) => o.id}
          />
        </div>
      )}
    </div>
  );
}
