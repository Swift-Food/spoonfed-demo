import { Link, Navigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store/useStore';
import type { Order, OrderStatus } from '../../lib/types';
import { canTransition } from '../../lib/stateMachine';
import { formatFriendlyDate } from '../../lib/dates';
import { formatUnit } from '../../lib/money';
import Money from '../../components/common/Money';
import StatusChip from '../../components/common/StatusChip';
import Field from '../../components/common/Field';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

const APPROVAL_LABELS: Record<Order['approvalStatus'], string> = {
  'n/a': 'Not required',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const DRIVER_VISIBLE_STATUSES: OrderStatus[] = ['confirmed', 'in_production', 'out_for_delivery', 'delivered', 'invoiced'];

const ACTION_CANDIDATES: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Confirm order' },
  { status: 'in_production', label: 'Start production' },
  { status: 'out_for_delivery', label: 'Send out for delivery' },
  { status: 'delivered', label: 'Mark delivered' },
  { status: 'invoiced', label: 'Generate invoice' },
];

export default function OrderDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const orders = useStore((s) => s.orders);
  const accounts = useStore((s) => s.accounts);
  const contacts = useStore((s) => s.contacts);
  const persona = useStore((s) => s.persona);
  const confirmOrder = useStore((s) => s.confirmOrder);
  const advanceStatus = useStore((s) => s.advanceStatus);
  const generateInvoice = useStore((s) => s.generateInvoice);
  const assignDriver = useStore((s) => s.assignDriver);

  const order = orders.find((o) => o.id === id);
  if (!order) return <Navigate to="/admin/calendar" replace />;

  const account = accounts.find((a) => a.id === order.accountId);
  const placedBy = contacts.find((c) => c.id === order.placedByContactId);
  const drivers = contacts.filter((c) => c.role === 'driver');

  const nextAction = ACTION_CANDIDATES.find((c) => canTransition(order, c.status, persona.role));

  const handleAction = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        confirmOrder(order.id);
        break;
      case 'invoiced':
        generateInvoice(order.id);
        break;
      default:
        advanceStatus(order.id, status);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/calendar" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
        ← Calendar
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl text-eden-green">{order.orderNumber}</h1>
        <StatusChip status={order.status} />
      </div>
      <p className="mt-1 text-sm text-eden-stone">
        {account?.name ?? 'Unknown account'} — placed by {placedBy?.name ?? 'Unknown contact'}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Delivery</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-eden-stone">Event date</dt>
              <dd className="text-eden-charcoal">{formatFriendlyDate(order.eventDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Location</dt>
              <dd className="text-eden-charcoal">
                {order.deliveryLocation.building} — {order.deliveryLocation.room}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Time</dt>
              <dd className="text-eden-charcoal">{order.requestedDeliveryTime}</dd>
            </div>
            {order.deliveryInstructions && (
              <div>
                <dt className="text-xs text-eden-stone">Instructions</dt>
                <dd className="text-eden-charcoal">{order.deliveryInstructions}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-eden-stone">Headcount</dt>
              <dd className="text-eden-charcoal">{order.headcount}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Billing</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-eden-stone">PO number</dt>
              <dd className="text-eden-charcoal">{order.poNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Cost centre</dt>
              <dd className="text-eden-charcoal">{order.costCentre || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Department code</dt>
              <dd className="text-eden-charcoal">{order.deptCode || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Approval</dt>
              <dd className="text-eden-charcoal">{APPROVAL_LABELS[order.approvalStatus]}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Items</h2>
        <div className="mt-3 divide-y divide-eden-sage/30">
          {order.lines.map((line) => (
            <div key={line.id} className="flex items-center justify-between gap-4 py-2 text-sm">
              <div>
                <p className="text-eden-charcoal">{line.nameSnapshot}</p>
                <p className="text-xs text-eden-stone">
                  {line.qty} × <Money amount={line.unitPriceSnapshot} /> {formatUnit(line.unit)}
                </p>
              </div>
              <Money amount={line.lineTotal} className="font-semibold text-eden-charcoal" />
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-eden-sage/30 pt-3 text-sm">
          <div className="flex justify-between text-eden-stone">
            <span>Subtotal</span>
            <Money amount={order.subtotal} />
          </div>
          <div className="flex justify-between text-eden-stone">
            <span>Tax</span>
            <Money amount={order.tax} />
          </div>
          <div className="flex justify-between text-base font-semibold text-eden-charcoal">
            <span>Total</span>
            <Money amount={order.total} />
          </div>
        </div>
      </div>

      {DRIVER_VISIBLE_STATUSES.includes(order.status) && (
        <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Driver</h2>
          <div className="mt-3 max-w-xs">
            <Field label="Assigned driver" htmlFor="driver">
              <select
                id="driver"
                value={order.driverId ?? ''}
                onChange={(e) => assignDriver(order.id, e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="" disabled>
                  Select a driver
                </option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      {nextAction && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => handleAction(nextAction.status)}
            className="rounded-lg bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
          >
            {nextAction.label}
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">History</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {order.history.map((entry) => (
            <li key={`${entry.at}-${entry.note}`} className="flex justify-between gap-4 text-eden-stone">
              <span className="text-eden-charcoal">{entry.note}</span>
              <span className="shrink-0 text-xs">{format(parseISO(entry.at), 'd MMM, HH:mm')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
