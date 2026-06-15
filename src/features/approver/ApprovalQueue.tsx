import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Order } from '../../lib/types';
import { formatFriendlyDate } from '../../lib/dates';
import EmptyState from '../../components/common/EmptyState';
import Table from '../../components/common/Table';
import Money from '../../components/common/Money';

export default function ApprovalQueue() {
  const orders = useStore((s) => s.orders);
  const contacts = useStore((s) => s.contacts);
  const persona = useStore((s) => s.persona);

  const pending = orders
    .filter((o) => o.status === 'pending_approval' && o.accountId === persona.accountId)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">Approvals</h1>
      <p className="mt-1 text-sm text-eden-stone">Orders awaiting your approval before Eden sees them.</p>

      {pending.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<CheckCircle size={32} />}
            title="Nothing to approve"
            description="Orders that need your sign-off will show up here."
          />
        </div>
      ) : (
        <div className="mt-6">
          <Table<Order>
            rows={pending}
            columns={[
              { header: 'Order #', render: (o) => o.orderNumber },
              { header: 'Event date', render: (o) => formatFriendlyDate(o.eventDate) },
              {
                header: 'Requested by',
                render: (o) => contacts.find((c) => c.id === o.placedByContactId)?.name ?? 'Unknown',
              },
              { header: 'Total', render: (o) => <Money amount={o.total} /> },
              {
                header: '',
                render: (o) => (
                  <Link to={`/approvals/${o.id}`} className="font-medium text-eden-green hover:text-eden-leaf">
                    Review
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
