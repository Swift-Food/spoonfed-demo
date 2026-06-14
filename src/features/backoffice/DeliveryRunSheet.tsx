import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { canTransition } from '../../lib/stateMachine';
import Field from '../../components/common/Field';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

const RUN_SHEET_STATUSES = ['confirmed', 'in_production', 'out_for_delivery', 'delivered'] as const;

export default function DeliveryRunSheet() {
  const orders = useStore((s) => s.orders);
  const contacts = useStore((s) => s.contacts);
  const persona = useStore((s) => s.persona);
  const advanceStatus = useStore((s) => s.advanceStatus);
  const assignDriver = useStore((s) => s.assignDriver);

  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const drivers = contacts.filter((c) => c.role === 'driver');

  const stops = orders
    .filter((o) => o.eventDate === date && RUN_SHEET_STATUSES.includes(o.status as (typeof RUN_SHEET_STATUSES)[number]))
    .sort((a, b) => a.requestedDeliveryTime.localeCompare(b.requestedDeliveryTime));

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">Delivery run sheet</h1>

      <div className="mt-4 max-w-xs">
        <Field label="Date" htmlFor="delivery-date">
          <input
            id="delivery-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      {stops.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No deliveries" description="No orders are scheduled for delivery on this date." />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {stops.map((order) => {
            const placedBy = contacts.find((c) => c.id === order.placedByContactId);
            const itemsSummary = order.lines.map((l) => `${l.qty} × ${l.nameSnapshot}`).join(', ');

            return (
              <div key={order.id} className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg text-eden-green">
                      {order.requestedDeliveryTime} — {order.orderNumber}
                    </p>
                    <p className="text-sm text-eden-charcoal">
                      {order.deliveryLocation.building} — {order.deliveryLocation.room}
                    </p>
                    <p className="text-sm text-eden-stone">{placedBy?.name ?? 'Unknown contact'}</p>
                  </div>
                  <StatusChip status={order.status} />
                </div>

                <p className="mt-3 text-sm text-eden-charcoal">{itemsSummary}</p>
                {order.deliveryInstructions && (
                  <p className="mt-1 text-sm text-eden-stone">{order.deliveryInstructions}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="max-w-xs flex-1">
                    <Field label="Driver" htmlFor={`driver-${order.id}`}>
                      <select
                        id={`driver-${order.id}`}
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

                  {order.status === 'in_production' && canTransition(order, 'out_for_delivery', persona.role) && (
                    <button
                      type="button"
                      onClick={() => advanceStatus(order.id, 'out_for_delivery')}
                      className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
                    >
                      Dispatch
                    </button>
                  )}
                  {order.status === 'out_for_delivery' && canTransition(order, 'delivered', persona.role) && (
                    <button
                      type="button"
                      onClick={() => advanceStatus(order.id, 'delivered')}
                      className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
                    >
                      Mark delivered
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <span className="text-sm text-eden-stone">Awaiting production</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
