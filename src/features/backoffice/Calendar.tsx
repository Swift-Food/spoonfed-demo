import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import StatusChip from '../../components/common/StatusChip';

export default function Calendar() {
  const orders = useStore((s) => s.orders);
  const accounts = useStore((s) => s.accounts);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-eden-green">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((d) => addDays(d, -7))}
            className="rounded-lg border border-eden-sage/40 bg-white p-2 text-eden-green hover:bg-eden-sand"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-eden-charcoal">
            {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
          </span>
          <button
            type="button"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
            className="rounded-lg border border-eden-sage/40 bg-white p-2 text-eden-green hover:bg-eden-sand"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const dayIso = format(day, 'yyyy-MM-dd');
          const dayOrders = orders
            .filter((o) => o.eventDate === dayIso && o.status !== 'draft')
            .sort((a, b) => a.requestedDeliveryTime.localeCompare(b.requestedDeliveryTime));

          return (
            <div
              key={dayIso}
              className={`rounded-xl border p-3 ${
                isSameDay(day, today) ? 'border-eden-leaf bg-eden-leaf/5' : 'border-eden-sage/40 bg-white'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-eden-stone">{format(day, 'EEE')}</p>
              <p className="font-serif text-lg text-eden-green">{format(day, 'd MMM')}</p>

              <div className="mt-2 space-y-2">
                {dayOrders.length === 0 ? (
                  <p className="text-xs text-eden-stone">No orders</p>
                ) : (
                  dayOrders.map((order) => {
                    const account = accounts.find((a) => a.id === order.accountId);
                    return (
                      <Link
                        key={order.id}
                        to={`/admin/orders/${order.id}`}
                        className="block rounded-lg border border-eden-sage/30 bg-eden-cream/60 p-2 text-xs hover:border-eden-leaf"
                      >
                        <p className="font-semibold text-eden-charcoal">{order.orderNumber}</p>
                        <p className="text-eden-stone">{account?.name ?? 'Unknown account'}</p>
                        <div className="mt-1">
                          <StatusChip status={order.status} />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
