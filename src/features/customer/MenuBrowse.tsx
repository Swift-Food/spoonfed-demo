import { Link, Navigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { earliestAvailableDate, menusForDate } from '../../lib/rules';
import { formatFriendlyDate } from '../../lib/dates';
import Money from '../../components/common/Money';
import EmptyState from '../../components/common/EmptyState';

export default function MenuBrowse() {
  const draftOrder = useStore((s) => s.draftOrder);
  const menus = useStore((s) => s.menus);
  const setDraftField = useStore((s) => s.setDraftField);

  if (!draftOrder) return <Navigate to="/order" replace />;

  const now = new Date();
  const available = menusForDate(menus, draftOrder.eventDate, now);
  const earliest = earliestAvailableDate(menus, now);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-serif text-3xl text-eden-green">
            Menus for {formatFriendlyDate(draftOrder.eventDate)}
          </h1>
          <p className="mt-1 text-sm text-eden-stone">
            Fresh, seasonal and sustainable — pick a menu to get started.
          </p>
        </div>
        <Link to="/order" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
          Change date
        </Link>
      </div>

      {available.length === 0 ? (
        <EmptyState
          icon={<Leaf size={32} />}
          title="Nothing fresh for that date yet"
          description={
            earliest
              ? `Our kitchen needs a little more notice. The earliest we can cater this is ${formatFriendlyDate(earliest)}.`
              : 'Our kitchen needs a little more notice for this date — try choosing a date further ahead.'
          }
          action={
            earliest && (
              <button
                type="button"
                onClick={() => setDraftField({ eventDate: earliest })}
                className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
              >
                Use {formatFriendlyDate(earliest)}
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((menu) => {
            const leadDays = Math.ceil(menu.leadTimeHours / 24);
            return (
              <Link
                key={menu.id}
                to={`/order/menu/${menu.id}`}
                className="flex flex-col rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h2 className="font-serif text-xl text-eden-green">{menu.name}</h2>
                <p className="mt-1 flex-1 text-sm text-eden-stone">{menu.description}</p>
                <div className="mt-4 flex flex-col gap-1 text-xs text-eden-stone">
                  <span>
                    Minimum order <Money amount={menu.minOrderValue} /> · minimum {menu.minPersons} people
                  </span>
                  <span>
                    Order by {menu.cutoffTime}, {leadDays} day{leadDays === 1 ? '' : 's'} ahead
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
