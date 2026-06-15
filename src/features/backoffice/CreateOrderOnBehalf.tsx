import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { useStore } from '../../store/useStore';
import Field from '../../components/common/Field';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

interface ReorderState {
  accountId?: string;
  contactId?: string;
}

export default function CreateOrderOnBehalf() {
  const navigate = useNavigate();
  const location = useLocation();
  const reorderState = (location.state ?? {}) as ReorderState;

  const accounts = useStore((s) => s.accounts);
  const contacts = useStore((s) => s.contacts);
  const startDraft = useStore((s) => s.startDraft);

  const activeAccounts = accounts.filter((a) => a.active);

  const [accountId, setAccountId] = useState(reorderState.accountId ?? activeAccounts[0]?.id ?? '');
  const accountContacts = contacts.filter((c) => c.accountId === accountId && c.role === 'orderer');
  const [contactId, setContactId] = useState(reorderState.contactId ?? accountContacts[0]?.id ?? '');
  const [eventDate, setEventDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAccountChange = (id: string) => {
    setAccountId(id);
    const firstContact = contacts.find((c) => c.accountId === id && c.role === 'orderer');
    setContactId(firstContact?.id ?? '');
  };

  const handleStart = () => {
    if (!accountId || !contactId) return;
    startDraft({ accountId, contactId, eventDate, source: 'back_office' });
    navigate('/order/menus');
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-3xl text-eden-green">Create order on behalf</h1>
      <p className="mt-2 text-sm text-eden-stone">
        Build an order for a client using the same menu builder customers use — handy for phone orders and
        reorders.
      </p>

      <div className="mt-6 space-y-4 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <Field label="Account" htmlFor="account">
          <select id="account" value={accountId} onChange={(e) => handleAccountChange(e.target.value)} className={INPUT_CLASS}>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Contact" htmlFor="contact">
          <select id="contact" value={contactId} onChange={(e) => setContactId(e.target.value)} className={INPUT_CLASS}>
            {accountContacts.length === 0 ? (
              <option value="">No ordering contacts</option>
            ) : (
              accountContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            )}
          </select>
        </Field>

        <Field label="Event date" htmlFor="event-date">
          <input
            id="event-date"
            type="date"
            min={today}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>

        <button
          type="button"
          onClick={handleStart}
          disabled={!accountId || !contactId}
          className="w-full rounded-lg bg-eden-green px-4 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start order
        </button>
      </div>
    </div>
  );
}
