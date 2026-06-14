import { Link, Navigate, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store/useStore';
import type { OrderStatus } from '../../lib/types';
import { STATUS_LABELS } from '../../lib/stateMachine';
import { formatFriendlyDate } from '../../lib/dates';
import { formatUnit } from '../../lib/money';
import Money from '../../components/common/Money';
import StatusChip from '../../components/common/StatusChip';
import Toast from '../../components/common/Toast';

const ORDER_STAGES: OrderStatus[] = [
  'submitted',
  'confirmed',
  'in_production',
  'out_for_delivery',
  'delivered',
  'invoiced',
];

export default function OrderTrack() {
  const { id } = useParams<{ id: string }>();
  const orders = useStore((s) => s.orders);
  const persona = useStore((s) => s.persona);

  const order = orders.find((o) => o.id === id);
  if (!order || order.placedByContactId !== persona.contactId) return <Navigate to="/orders" replace />;

  const stages: OrderStatus[] = order.requiresApproval ? ['pending_approval', ...ORDER_STAGES] : ORDER_STAGES;
  const currentIndex = stages.indexOf(order.status);

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/orders" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
        ← My orders
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl text-eden-green">{order.orderNumber}</h1>
        <StatusChip status={order.status} />
      </div>
      <p className="mt-1 text-sm text-eden-stone">Event date: {formatFriendlyDate(order.eventDate)}</p>

      {order.status === 'cancelled' && (
        <div className="mt-4">
          <Toast
            variant="warning"
            message={order.history[order.history.length - 1]?.note ?? 'This order has been cancelled.'}
          />
        </div>
      )}

      {order.approvalStatus === 'rejected' && order.approvalNote && (
        <div className="mt-4">
          <Toast variant="warning" message={order.approvalNote} />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Status</h2>
        {order.status === 'draft' ? (
          <p className="mt-2 text-sm text-eden-stone">Not yet submitted.</p>
        ) : order.status === 'cancelled' ? (
          <p className="mt-2 text-sm text-eden-stone">This order was cancelled and is no longer in progress.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {stages.map((stage, i) => {
              const state = i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming';
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      state === 'upcoming'
                        ? 'border border-eden-sage text-eden-sage'
                        : 'bg-eden-green text-eden-cream'
                    }`}
                  >
                    {state === 'complete' ? <Check size={14} /> : i + 1}
                  </span>
                  <span
                    className={`text-sm ${
                      state === 'upcoming'
                        ? 'text-eden-stone'
                        : state === 'current'
                          ? 'font-semibold text-eden-green'
                          : 'text-eden-charcoal'
                    }`}
                  >
                    {STATUS_LABELS[stage]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Delivery</h2>
          <dl className="mt-3 space-y-2 text-sm">
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
