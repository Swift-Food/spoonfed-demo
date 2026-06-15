import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { getOrderMenu, requiresApproval, validateMinimums } from '../../lib/rules';
import { formatFriendlyDate, formatFriendlyDateTime, getOrderCutoff } from '../../lib/dates';
import { formatMoney, formatUnit } from '../../lib/money';
import Field from '../../components/common/Field';
import Money from '../../components/common/Money';
import Toast from '../../components/common/Toast';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

export default function Checkout() {
  const draftOrder = useStore((s) => s.draftOrder);
  const orders = useStore((s) => s.orders);
  const persona = useStore((s) => s.persona);
  const accounts = useStore((s) => s.accounts);
  const contacts = useStore((s) => s.contacts);
  const items = useStore((s) => s.items);
  const menus = useStore((s) => s.menus);
  const setDraftField = useStore((s) => s.setDraftField);
  const submitDraft = useStore((s) => s.submitDraft);
  const amendOrder = useStore((s) => s.amendOrder);
  const createBackOfficeOrder = useStore((s) => s.createBackOfficeOrder);

  const account = draftOrder ? accounts.find((a) => a.id === draftOrder.accountId) : undefined;
  const menu = draftOrder ? getOrderMenu(draftOrder, items, menus) : undefined;
  const presetLocations = account?.deliveryLocations ?? [];

  const presetMatch = draftOrder
    ? presetLocations.findIndex(
        (loc) =>
          loc.building === draftOrder.deliveryLocation.building && loc.room === draftOrder.deliveryLocation.room,
      )
    : -1;
  const hasExistingLocation = !!draftOrder?.deliveryLocation.building;

  const [headcount, setHeadcount] = useState(draftOrder?.headcount || menu?.minPersons || 1);
  const [locationChoice, setLocationChoice] = useState<string>(() => {
    if (presetMatch >= 0) return String(presetMatch);
    if (hasExistingLocation) return 'other';
    return presetLocations.length > 0 ? '0' : 'other';
  });
  const [customBuilding, setCustomBuilding] = useState(
    hasExistingLocation && presetMatch < 0 ? draftOrder?.deliveryLocation.building ?? '' : '',
  );
  const [customRoom, setCustomRoom] = useState(
    hasExistingLocation && presetMatch < 0 ? draftOrder?.deliveryLocation.room ?? '' : '',
  );
  const [deliveryTime, setDeliveryTime] = useState(draftOrder?.requestedDeliveryTime ?? '12:00');
  const [instructions, setInstructions] = useState(draftOrder?.deliveryInstructions ?? '');
  const [poNumber, setPoNumber] = useState(draftOrder?.poNumber ?? '');
  const [costCentre, setCostCentre] = useState(draftOrder?.costCentre ?? account?.costCentres[0] ?? '');
  const [deptCode, setDeptCode] = useState(draftOrder?.deptCode ?? '');
  const [poError, setPoError] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  if (!draftOrder) return <Navigate to={redirectTo ?? '/order'} replace />;
  if (draftOrder.lines.length === 0) return <Navigate to="/cart" replace />;
  if (!account) return <Navigate to="/order" replace />;

  const isEditing = orders.some((o) => o.id === draftOrder.id);
  const isBackOffice = !isEditing && draftOrder.source === 'back_office';

  const deliveryLocation =
    locationChoice === 'other'
      ? { building: customBuilding.trim(), room: customRoom.trim() }
      : presetLocations[Number(locationChoice)] ?? { building: '', room: '' };

  const violations = menu ? validateMinimums({ ...draftOrder, headcount }, menu, items) : [];
  const needsApproval = requiresApproval(account, draftOrder.total);
  const approver = contacts.find((c) => c.accountId === account.id && c.role === 'approver');

  const handleSubmit = () => {
    if (account.poRequired && poNumber.trim() === '') {
      setPoError(true);
      return;
    }
    setPoError(false);

    const patch = {
      headcount,
      deliveryLocation,
      requestedDeliveryTime: deliveryTime,
      deliveryInstructions: instructions.trim() || undefined,
      poNumber: poNumber.trim() || undefined,
      costCentre,
      deptCode: deptCode.trim() || undefined,
    };

    if (isEditing) {
      setRedirectTo(persona.role === 'caterer_admin' ? `/admin/orders/${draftOrder.id}` : `/orders/${draftOrder.id}`);
      amendOrder(draftOrder.id, {
        ...patch,
        lines: draftOrder.lines,
        subtotal: draftOrder.subtotal,
        tax: draftOrder.tax,
        total: draftOrder.total,
      });
    } else if (isBackOffice) {
      setRedirectTo(`/admin/orders/${draftOrder.id}`);
      setDraftField(patch);
      createBackOfficeOrder();
    } else {
      setRedirectTo('/orders');
      setDraftField(patch);
      submitDraft();
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl text-eden-green">
        {isEditing ? 'Edit order' : isBackOffice ? 'Create order' : 'Checkout'}
      </h1>
      <p className="mt-1 text-sm text-eden-stone">Event date: {formatFriendlyDate(draftOrder.eventDate)}</p>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Order summary</h2>
        <div className="mt-3 divide-y divide-eden-sage/30">
          {draftOrder.lines.map((line) => (
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
            <Money amount={draftOrder.subtotal} />
          </div>
          <div className="flex justify-between text-eden-stone">
            <span>Tax</span>
            <Money amount={draftOrder.tax} />
          </div>
          <div className="flex justify-between text-base font-semibold text-eden-charcoal">
            <span>Total</span>
            <Money amount={draftOrder.total} />
          </div>
        </div>
      </div>

      {needsApproval && !isEditing && (
        <div className="mt-4">
          <Toast
            variant="warning"
            message={
              isBackOffice
                ? `This order totals ${formatMoney(draftOrder.total)}, which meets ${account.name}'s ${formatMoney(account.approvalThreshold)} approval threshold. It'll be routed to ${approver?.name ?? 'the account approver'} for approval before being confirmed.`
                : `This order totals ${formatMoney(draftOrder.total)}, which meets ${account.name}'s ${formatMoney(account.approvalThreshold)} approval threshold. It'll be sent to ${approver?.name ?? 'your approver'} for approval before Eden sees it.`
            }
          />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Delivery &amp; billing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Headcount" htmlFor="headcount" hint={menu ? `Minimum ${menu.minPersons} people` : undefined}>
            <input
              id="headcount"
              type="number"
              min={menu?.minPersons ?? 1}
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Delivery time" htmlFor="delivery-time">
            <input
              id="delivery-time"
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Delivery location" htmlFor="delivery-location">
            <select
              id="delivery-location"
              value={locationChoice}
              onChange={(e) => setLocationChoice(e.target.value)}
              className={INPUT_CLASS}
            >
              {presetLocations.map((loc, i) => (
                <option key={`${loc.building}-${loc.room}`} value={String(i)}>
                  {loc.building} — {loc.room}
                </option>
              ))}
              <option value="other">Other location…</option>
            </select>
          </Field>

          <Field label="Cost centre" htmlFor="cost-centre">
            <select
              id="cost-centre"
              value={costCentre}
              onChange={(e) => setCostCentre(e.target.value)}
              className={INPUT_CLASS}
            >
              {account.costCentres.map((cc) => (
                <option key={cc} value={cc}>
                  {cc}
                </option>
              ))}
            </select>
          </Field>

          {locationChoice === 'other' && (
            <>
              <Field label="Building" htmlFor="custom-building">
                <input
                  id="custom-building"
                  type="text"
                  value={customBuilding}
                  onChange={(e) => setCustomBuilding(e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Room / floor" htmlFor="custom-room">
                <input
                  id="custom-room"
                  type="text"
                  value={customRoom}
                  onChange={(e) => setCustomRoom(e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
            </>
          )}

          <Field
            label={account.poRequired ? 'PO number (required)' : 'PO number'}
            htmlFor="po-number"
          >
            <input
              id="po-number"
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Department code" htmlFor="dept-code" hint="Optional">
            <input
              id="dept-code"
              type="text"
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Delivery instructions" htmlFor="delivery-instructions" hint="Optional — access notes, lift codes, etc.">
              <textarea
                id="delivery-instructions"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </div>

        {poError && (
          <p className="mt-3 text-sm text-eden-berry">A PO number is required for {account.name}.</p>
        )}

        {menu && (
          <p className="mt-4 text-xs text-eden-stone">
            You can edit this order until {formatFriendlyDateTime(getOrderCutoff(menu, draftOrder.eventDate))}.
          </p>
        )}
      </div>

      {violations.length > 0 && (
        <div className="mt-4 space-y-2">
          {violations.map((message) => (
            <Toast key={message} message={message} variant="warning" />
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={violations.length > 0}
          className="rounded-lg bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isEditing ? 'Save changes' : isBackOffice ? 'Create order' : 'Place order'}
        </button>
      </div>
    </div>
  );
}
