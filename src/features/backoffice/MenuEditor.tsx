import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Allergen, DietaryTag, Item, ServiceType, Unit } from '../../lib/types';
import { ALLERGEN_LABELS, DIETARY_LABELS } from '../../lib/labels';
import { UNIT_LABELS } from '../../lib/money';
import Field from '../../components/common/Field';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UNIT_OPTIONS = Object.keys(UNIT_LABELS) as Unit[];
const ALLERGEN_OPTIONS = Object.keys(ALLERGEN_LABELS) as Allergen[];
const DIETARY_OPTIONS = Object.keys(DIETARY_LABELS) as DietaryTag[];

export default function MenuEditor() {
  const { id } = useParams<{ id: string }>();
  const menus = useStore((s) => s.menus);
  const items = useStore((s) => s.items);
  const updateMenu = useStore((s) => s.updateMenu);
  const createItem = useStore((s) => s.createItem);
  const updateItem = useStore((s) => s.updateItem);

  const menu = menus.find((m) => m.id === id);

  const [name, setName] = useState(menu?.name ?? '');
  const [description, setDescription] = useState(menu?.description ?? '');
  const [serviceType, setServiceType] = useState<ServiceType>(menu?.serviceType ?? 'single');
  const [availableFrom, setAvailableFrom] = useState(menu?.availableFrom ?? '');
  const [availableTo, setAvailableTo] = useState(menu?.availableTo ?? '');
  const [leadTimeHours, setLeadTimeHours] = useState(menu?.leadTimeHours ?? 24);
  const [cutoffTime, setCutoffTime] = useState(menu?.cutoffTime ?? '10:00');
  const [availableDays, setAvailableDays] = useState<number[]>(menu?.availableDays ?? []);
  const [minOrderValue, setMinOrderValue] = useState(menu?.minOrderValue ?? 0);
  const [minPersons, setMinPersons] = useState(menu?.minPersons ?? 1);
  const [active, setActive] = useState(menu?.active ?? true);
  const [offline, setOffline] = useState(!!menu?.offline);

  if (!menu) return <Navigate to="/admin/menus" replace />;

  const menuItems = items.filter((i) => i.menuId === menu.id);

  const toggleDay = (day: number) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const handleSaveMenu = () => {
    updateMenu(menu.id, {
      name,
      description,
      serviceType,
      availableFrom,
      availableTo,
      leadTimeHours,
      cutoffTime,
      availableDays,
      minOrderValue,
      minPersons,
      active,
      offline,
    });
  };

  const handleAddItem = () => {
    createItem({
      menuId: menu.id,
      name: 'New item',
      description: '',
      price: 0,
      unit: 'each',
      minQty: 1,
      maxQty: 10,
      allergens: [],
      dietary: [],
      portion: '',
      available: true,
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/menus" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
        ← Menus
      </Link>

      <h1 className="mt-2 font-serif text-3xl text-eden-green">{menu.name}</h1>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Menu details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="menu-name">
            <input id="menu-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label="Service type" htmlFor="menu-service-type">
            <select
              id="menu-service-type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className={INPUT_CLASS}
            >
              <option value="single">Single</option>
              <option value="multi_slot">Multi-slot</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="menu-description">
              <textarea
                id="menu-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
          <Field label="Available from" htmlFor="menu-from">
            <input id="menu-from" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label="Available to" htmlFor="menu-to">
            <input id="menu-to" type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label="Lead time (hours)" htmlFor="menu-lead-time">
            <input
              id="menu-lead-time"
              type="number"
              min={0}
              value={leadTimeHours}
              onChange={(e) => setLeadTimeHours(Number(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Cutoff time" htmlFor="menu-cutoff">
            <input id="menu-cutoff" type="time" value={cutoffTime} onChange={(e) => setCutoffTime(e.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label="Minimum order value (£)" htmlFor="menu-min-order">
            <input
              id="menu-min-order"
              type="number"
              min={0}
              step="0.01"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(Number(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Minimum persons" htmlFor="menu-min-persons">
            <input
              id="menu-min-persons"
              type="number"
              min={1}
              value={minPersons}
              onChange={(e) => setMinPersons(Number(e.target.value) || 1)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="mt-4">
          <span className="text-sm font-medium text-eden-charcoal">Available days</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_LABELS.map((label, day) => (
              <label key={day} className="flex items-center gap-1.5 rounded-lg border border-eden-sage px-2.5 py-1 text-sm text-eden-charcoal">
                <input
                  type="checkbox"
                  checked={availableDays.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="h-4 w-4 accent-eden-green"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-eden-charcoal">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-eden-green" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-eden-charcoal">
            <input type="checkbox" checked={offline} onChange={(e) => setOffline(e.target.checked)} className="h-4 w-4 accent-eden-green" />
            Offline (quote-only)
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSaveMenu}
            className="rounded-lg bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
          >
            Save menu details
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-eden-green">Items</h2>
        <button
          type="button"
          onClick={handleAddItem}
          className="rounded-lg border border-eden-sage px-4 py-2 text-sm font-medium text-eden-green hover:bg-eden-cream"
        >
          Add item
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {menuItems.map((item) => (
          <ItemEditor key={item.id} item={item} onSave={(patch) => updateItem(item.id, patch)} />
        ))}
      </div>
    </div>
  );
}

function ItemEditor({ item, onSave }: { item: Item; onSave: (patch: Partial<Item>) => void }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price);
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [minQty, setMinQty] = useState(item.minQty);
  const [maxQty, setMaxQty] = useState(item.maxQty);
  const [portion, setPortion] = useState(item.portion);
  const [available, setAvailable] = useState(item.available);
  const [allergens, setAllergens] = useState<Allergen[]>(item.allergens);
  const [dietary, setDietary] = useState<DietaryTag[]>(item.dietary);

  const toggleAllergen = (a: Allergen) => {
    setAllergens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };
  const toggleDietary = (d: DietaryTag) => {
    setDietary((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSave = () => {
    onSave({ name, description, price, unit, minQty, maxQty, portion, available, allergens, dietary });
  };

  return (
    <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`item-name-${item.id}`}>
          <input id={`item-name-${item.id}`} type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
        </Field>
        <Field label="Portion" htmlFor={`item-portion-${item.id}`}>
          <input id={`item-portion-${item.id}`} type="text" value={portion} onChange={(e) => setPortion(e.target.value)} className={INPUT_CLASS} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" htmlFor={`item-description-${item.id}`}>
            <textarea
              id={`item-description-${item.id}`}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <Field label="Price (£)" htmlFor={`item-price-${item.id}`}>
          <input
            id={`item-price-${item.id}`}
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Unit" htmlFor={`item-unit-${item.id}`}>
          <select id={`item-unit-${item.id}`} value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={INPUT_CLASS}>
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Min quantity" htmlFor={`item-min-${item.id}`}>
          <input
            id={`item-min-${item.id}`}
            type="number"
            min={0}
            value={minQty}
            onChange={(e) => setMinQty(Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Max quantity" htmlFor={`item-max-${item.id}`}>
          <input
            id={`item-max-${item.id}`}
            type="number"
            min={0}
            value={maxQty}
            onChange={(e) => setMaxQty(Number(e.target.value) || 0)}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <span className="text-sm font-medium text-eden-charcoal">Allergens</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((a) => (
              <label key={a} className="flex items-center gap-1.5 rounded-lg border border-eden-sage px-2.5 py-1 text-sm text-eden-charcoal">
                <input type="checkbox" checked={allergens.includes(a)} onChange={() => toggleAllergen(a)} className="h-4 w-4 accent-eden-green" />
                {ALLERGEN_LABELS[a]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-eden-charcoal">Dietary</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((d) => (
              <label key={d} className="flex items-center gap-1.5 rounded-lg border border-eden-sage px-2.5 py-1 text-sm text-eden-charcoal">
                <input type="checkbox" checked={dietary.includes(d)} onChange={() => toggleDietary(d)} className="h-4 w-4 accent-eden-green" />
                {DIETARY_LABELS[d]}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-eden-charcoal">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 accent-eden-green" />
          Available
        </label>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
        >
          Save item
        </button>
      </div>
    </div>
  );
}
