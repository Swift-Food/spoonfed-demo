import { Link, Navigate } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getOrderMenu, validateMinimums } from '../../lib/rules';
import { formatUnit } from '../../lib/money';
import EmptyState from '../../components/common/EmptyState';
import QtyStepper from '../../components/common/QtyStepper';
import Money from '../../components/common/Money';
import Toast from '../../components/common/Toast';

export default function Cart() {
  const draftOrder = useStore((s) => s.draftOrder);
  const items = useStore((s) => s.items);
  const menus = useStore((s) => s.menus);
  const updateLineQty = useStore((s) => s.updateLineQty);
  const removeLine = useStore((s) => s.removeLine);

  if (!draftOrder) return <Navigate to="/order" replace />;

  if (draftOrder.lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={32} />}
        title="Your cart is empty"
        description="Browse Eden's menus to add something delicious."
        action={
          <Link
            to="/order/menus"
            className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
          >
            Browse menus
          </Link>
        }
      />
    );
  }

  const menu = getOrderMenu(draftOrder, items, menus);
  const violations = menu ? validateMinimums(draftOrder, menu, items) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl text-eden-green">Your cart</h1>

      <div className="mt-6 divide-y divide-eden-sage/30 rounded-xl border border-eden-sage/40 bg-white">
        {draftOrder.lines.map((line) => {
          const item = items.find((i) => i.id === line.itemId);
          return (
            <div key={line.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg text-eden-green">{line.nameSnapshot}</p>
                <p className="text-xs text-eden-stone">
                  {formatUnit(line.unit)} · <Money amount={line.unitPriceSnapshot} /> each
                </p>
              </div>
              <QtyStepper
                value={line.qty}
                min={item?.minQty ?? 1}
                max={item?.maxQty ?? line.qty}
                onChange={(next) => updateLineQty(line.id, next)}
              />
              <Money amount={line.lineTotal} className="w-20 text-right text-sm font-semibold text-eden-charcoal" />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                aria-label={`Remove ${line.nameSnapshot}`}
                className="text-eden-stone transition-colors hover:text-eden-berry"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-1 rounded-xl border border-eden-sage/40 bg-white p-4 text-sm">
        <div className="flex justify-between text-eden-stone">
          <span>Subtotal</span>
          <Money amount={draftOrder.subtotal} />
        </div>
        <div className="flex justify-between font-semibold text-eden-charcoal">
          <span>Total</span>
          <Money amount={draftOrder.total} />
        </div>
      </div>

      {violations.length > 0 && (
        <div className="mt-4 space-y-2">
          {violations.map((message) => (
            <Toast key={message} message={message} variant="warning" />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Link to="/order/menus" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
          ← Add more items
        </Link>
        <Link
          to="/checkout"
          className="rounded-lg bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
        >
          Continue to checkout
        </Link>
      </div>
    </div>
  );
}
