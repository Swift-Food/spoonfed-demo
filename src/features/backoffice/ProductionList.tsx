import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { canTransition } from '../../lib/stateMachine';
import { formatUnit } from '../../lib/money';
import type { Allergen, Unit } from '../../lib/types';
import Field from '../../components/common/Field';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import { AllergenTags } from '../../components/common/Tags';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

interface AggregatedItem {
  itemId: string;
  name: string;
  qty: number;
  unit: Unit;
  allergens: Allergen[];
}

export default function ProductionList() {
  const orders = useStore((s) => s.orders);
  const accounts = useStore((s) => s.accounts);
  const persona = useStore((s) => s.persona);
  const advanceStatus = useStore((s) => s.advanceStatus);

  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [tab, setTab] = useState<'by_item' | 'by_order'>('by_item');

  const relevantOrders = orders.filter(
    (o) => o.eventDate === date && (o.status === 'confirmed' || o.status === 'in_production'),
  );

  const itemMap = new Map<string, AggregatedItem>();
  for (const order of relevantOrders) {
    for (const line of order.lines) {
      const existing = itemMap.get(line.itemId);
      if (existing) {
        existing.qty += line.qty;
        for (const allergen of line.allergenSnapshot) {
          if (!existing.allergens.includes(allergen)) existing.allergens.push(allergen);
        }
      } else {
        itemMap.set(line.itemId, {
          itemId: line.itemId,
          name: line.nameSnapshot,
          qty: line.qty,
          unit: line.unit,
          allergens: [...line.allergenSnapshot],
        });
      }
    }
  }
  const aggregatedItems = Array.from(itemMap.values());

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">Production</h1>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xs">
          <Field label="Date" htmlFor="production-date">
            <input
              id="production-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('by_item')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'by_item'
                ? 'bg-eden-green text-eden-cream'
                : 'border border-eden-sage text-eden-green hover:bg-eden-sage/20'
            }`}
          >
            By item
          </button>
          <button
            type="button"
            onClick={() => setTab('by_order')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tab === 'by_order'
                ? 'bg-eden-green text-eden-cream'
                : 'border border-eden-sage text-eden-green hover:bg-eden-sage/20'
            }`}
          >
            By order
          </button>
        </div>
      </div>

      {relevantOrders.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing to prepare" description="No confirmed orders for this date yet." />
        </div>
      ) : tab === 'by_item' ? (
        <div className="mt-6">
          <Table
            columns={[
              { header: 'Item', render: (row: AggregatedItem) => row.name },
              { header: 'Quantity', render: (row: AggregatedItem) => `${row.qty} ${formatUnit(row.unit)}` },
              { header: 'Allergens', render: (row: AggregatedItem) => <AllergenTags allergens={row.allergens} /> },
            ]}
            rows={aggregatedItems}
            rowKey={(row) => row.itemId}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {relevantOrders.map((order) => {
            const account = accounts.find((a) => a.id === order.accountId);
            return (
              <div key={order.id} className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg text-eden-green">{order.orderNumber}</p>
                    <p className="text-sm text-eden-stone">
                      {account?.name ?? 'Unknown account'} — {order.headcount} people
                    </p>
                  </div>
                  {order.status === 'confirmed' && canTransition(order, 'in_production', persona.role) && (
                    <button
                      type="button"
                      onClick={() => advanceStatus(order.id, 'in_production')}
                      className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
                    >
                      Start production
                    </button>
                  )}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-eden-charcoal">
                  {order.lines.map((line) => (
                    <li key={line.id}>
                      {line.nameSnapshot} × {line.qty}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
