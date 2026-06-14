import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { DietaryTag, Item } from '../../lib/types';
import { formatMoney, formatUnit } from '../../lib/money';
import { AllergenTags, DietaryTags } from '../../components/common/Tags';
import { DIETARY_LABELS } from '../../lib/labels';
import QtyStepper from '../../components/common/QtyStepper';
import Money from '../../components/common/Money';

const DIETARY_FILTERS: DietaryTag[] = ['vegan', 'vegetarian', 'gluten_free', 'halal'];

export default function MenuDetail() {
  const { menuId } = useParams<{ menuId: string }>();
  const draftOrder = useStore((s) => s.draftOrder);
  const menus = useStore((s) => s.menus);
  const items = useStore((s) => s.items);

  const [activeTags, setActiveTags] = useState<DietaryTag[]>([]);

  if (!draftOrder) return <Navigate to="/order" replace />;

  const menu = menus.find((m) => m.id === menuId);
  if (!menu) return <Navigate to="/order/menus" replace />;

  const menuItems = items.filter((i) => i.menuId === menu.id && i.available);
  const visibleItems =
    activeTags.length === 0
      ? menuItems
      : menuItems.filter((i) => i.dietary.some((tag) => activeTags.includes(tag)));

  const toggleTag = (tag: DietaryTag) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <div className={draftOrder.lines.length > 0 ? 'pb-20' : ''}>
      <Link to="/order/menus" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
        ← All menus
      </Link>

      <h1 className="mt-2 font-serif text-3xl text-eden-green">{menu.name}</h1>
      <p className="mt-1 text-sm text-eden-stone">{menu.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {DIETARY_FILTERS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTags.includes(tag)
                ? 'bg-eden-green text-eden-cream'
                : 'border border-eden-sage text-eden-green hover:bg-eden-sage/20'
            }`}
          >
            {DIETARY_LABELS[tag]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visibleItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {draftOrder.lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-eden-sage/40 bg-eden-cream/95 px-4 py-3 shadow-lg backdrop-blur sm:px-8">
          <Link to="/cart" className="flex items-center justify-center gap-2 text-sm font-semibold text-eden-green">
            <span>{draftOrder.lines.reduce((sum, l) => sum + l.qty, 0)} items</span>
            <span aria-hidden="true">·</span>
            <Money amount={draftOrder.total} />
            <span aria-hidden="true">·</span>
            <span>View cart →</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const draftOrder = useStore((s) => s.draftOrder);
  const addLine = useStore((s) => s.addLine);
  const updateLineQty = useStore((s) => s.updateLineQty);
  const removeLine = useStore((s) => s.removeLine);

  const existingLine = draftOrder?.lines.find((l) => l.itemId === item.id);
  const [qty, setQty] = useState(existingLine?.qty ?? item.minQty);

  return (
    <div className="flex flex-col rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg text-eden-green">{item.name}</h3>
      <p className="mt-1 flex-1 text-sm text-eden-stone">{item.description}</p>
      <p className="mt-2 text-sm font-semibold text-eden-charcoal">
        {formatMoney(item.price)} <span className="font-normal text-eden-stone">{formatUnit(item.unit)}</span>
      </p>

      <div className="mt-2 flex flex-col gap-1.5">
        <DietaryTags tags={item.dietary} />
        <AllergenTags allergens={item.allergens} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <QtyStepper
          value={qty}
          min={item.minQty}
          max={item.maxQty}
          onChange={(next) => {
            setQty(next);
            if (existingLine) updateLineQty(existingLine.id, next);
          }}
        />
        {existingLine ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-medium text-eden-leaf">
              <Check size={14} /> In cart
            </span>
            <button
              type="button"
              onClick={() => removeLine(existingLine.id)}
              aria-label="Remove from cart"
              className="text-eden-stone transition-colors hover:text-eden-berry"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addLine(item.id, qty)}
            className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
}
