import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { useStore } from '../../store/useStore';
import Field from '../../components/common/Field';
import Toast from '../../components/common/Toast';

export default function DatePicker() {
  const navigate = useNavigate();
  const persona = useStore((s) => s.persona);
  const draftOrder = useStore((s) => s.draftOrder);
  const startDraft = useStore((s) => s.startDraft);
  const setDraftField = useStore((s) => s.setDraftField);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [eventDate, setEventDate] = useState(draftOrder?.eventDate ?? format(addDays(new Date(), 1), 'yyyy-MM-dd'));

  const willClearCart =
    !!draftOrder && draftOrder.lines.length > 0 && eventDate !== draftOrder.eventDate;

  const handleContinue = () => {
    if (draftOrder) {
      setDraftField({ eventDate });
    } else {
      startDraft({ accountId: persona.accountId!, contactId: persona.contactId!, eventDate });
    }
    navigate('/order/menus');
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-3xl text-eden-green">Choose your event date</h1>
      <p className="mt-2 text-sm text-eden-stone">
        Tell us when you need catering and we&rsquo;ll show you what Eden&rsquo;s kitchen can do for that day —
        fresh, seasonal and made to order.
      </p>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <Field label="Event date" htmlFor="event-date">
          <input
            id="event-date"
            type="date"
            min={today}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green"
          />
        </Field>

        {willClearCart && (
          <div className="mt-4">
            <Toast variant="warning" message="Changing your event date will clear the items currently in your cart, as they're from another day's menu." />
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="mt-6 w-full rounded-lg bg-eden-green px-4 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
