import { Link, Navigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Contact, Order } from '../../lib/types';
import { formatFriendlyDate } from '../../lib/dates';
import { formatMoney } from '../../lib/money';
import Money from '../../components/common/Money';
import StatusChip from '../../components/common/StatusChip';
import Table from '../../components/common/Table';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const accounts = useStore((s) => s.accounts);
  const contacts = useStore((s) => s.contacts);
  const orders = useStore((s) => s.orders);

  const account = accounts.find((a) => a.id === id);
  if (!account) return <Navigate to="/admin/accounts" replace />;

  const accountContacts = contacts.filter((c) => c.accountId === account.id);
  const accountOrders = orders
    .filter((o) => o.accountId === account.id && !o.isQuote)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/accounts" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
        ← Accounts
      </Link>

      <h1 className="mt-2 font-serif text-3xl text-eden-green">{account.name}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Account config</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-eden-stone">Payment terms</dt>
              <dd className="text-eden-charcoal">{account.paymentTermsDays} days</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Approval threshold</dt>
              <dd className="text-eden-charcoal">
                {account.requiresApproval ? `Orders over ${formatMoney(account.approvalThreshold)} need approval` : 'Not required'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">PO required</dt>
              <dd className="text-eden-charcoal">{account.poRequired ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Cost centres</dt>
              <dd className="text-eden-charcoal">{account.costCentres.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Status</dt>
              <dd className="text-eden-charcoal">{account.active ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Delivery locations</h2>
          <ul className="mt-3 space-y-2 text-sm text-eden-charcoal">
            {account.deliveryLocations.map((loc) => (
              <li key={`${loc.building}-${loc.room}`}>
                {loc.building} — {loc.room}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Contacts</h2>
        <div className="mt-3">
          <Table<Contact>
            rows={accountContacts}
            columns={[
              { header: 'Name', render: (c) => c.name },
              { header: 'Email', render: (c) => c.email },
              { header: 'Role', render: (c) => c.role },
            ]}
            rowKey={(c) => c.id}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Order history</h2>
        <div className="mt-3">
          <Table<Order>
            rows={accountOrders}
            columns={[
              { header: 'Order #', render: (o) => o.orderNumber },
              { header: 'Event date', render: (o) => formatFriendlyDate(o.eventDate) },
              { header: 'Status', render: (o) => <StatusChip status={o.status} /> },
              { header: 'Total', render: (o) => <Money amount={o.total} /> },
              {
                header: '',
                render: (o) => (
                  <Link
                    to="/admin/orders/new"
                    state={{ accountId: account.id, contactId: o.placedByContactId }}
                    className="font-medium text-eden-green hover:text-eden-leaf"
                  >
                    Reorder
                  </Link>
                ),
                className: 'text-right',
              },
            ]}
            rowKey={(o) => o.id}
          />
        </div>
      </div>
    </div>
  );
}
