import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { formatFriendlyDate } from '../../lib/dates';
import { formatUnit } from '../../lib/money';
import Money from '../../components/common/Money';
import Modal from '../../components/common/Modal';
import StatusChip from '../../components/common/StatusChip';

const INPUT_CLASS =
  'rounded-lg border border-eden-sage bg-white px-3 py-2 text-sm text-eden-charcoal focus:border-eden-green focus:outline-none focus:ring-1 focus:ring-eden-green';

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const contacts = useStore((s) => s.contacts);
  const persona = useStore((s) => s.persona);
  const approveOrder = useStore((s) => s.approveOrder);
  const rejectOrder = useStore((s) => s.rejectOrder);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const order = orders.find((o) => o.id === id);
  if (!order || order.status !== 'pending_approval' || order.accountId !== persona.accountId) {
    return <Navigate to="/approvals" replace />;
  }

  const placedBy = contacts.find((c) => c.id === order.placedByContactId);

  const handleApprove = () => {
    approveOrder(order.id);
    navigate('/approvals');
  };

  const handleReject = () => {
    if (!rejectNote.trim()) return;
    rejectOrder(order.id, rejectNote.trim());
    navigate('/approvals');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/approvals" className="text-sm font-medium text-eden-green hover:text-eden-leaf">
        ← Approvals
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl text-eden-green">{order.orderNumber}</h1>
        <StatusChip status={order.status} />
      </div>
      <p className="mt-1 text-sm text-eden-stone">
        Requested by {placedBy?.name ?? 'Unknown'} for {formatFriendlyDate(order.eventDate)}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Delivery</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-eden-stone">Location</dt>
              <dd className="text-eden-charcoal">
                {order.deliveryLocation.building} — {order.deliveryLocation.room}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Time</dt>
              <dd className="text-eden-charcoal">{order.requestedDeliveryTime}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Headcount</dt>
              <dd className="text-eden-charcoal">{order.headcount}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-lg text-eden-green">Billing</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-eden-stone">PO number</dt>
              <dd className="text-eden-charcoal">{order.poNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Cost centre</dt>
              <dd className="text-eden-charcoal">{order.costCentre || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-eden-stone">Department code</dt>
              <dd className="text-eden-charcoal">{order.deptCode || '—'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-eden-sage/40 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-eden-green">Items</h2>
        <div className="mt-3 divide-y divide-eden-sage/30">
          {order.lines.map((line) => (
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
            <Money amount={order.subtotal} />
          </div>
          <div className="flex justify-between text-eden-stone">
            <span>Tax</span>
            <Money amount={order.tax} />
          </div>
          <div className="flex justify-between text-base font-semibold text-eden-charcoal">
            <span>Total</span>
            <Money amount={order.total} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          className="rounded-lg border border-eden-berry px-5 py-2.5 text-sm font-semibold text-eden-berry hover:bg-eden-berry/10"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleApprove}
          className="rounded-lg bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
        >
          Approve
        </button>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject this order">
        <p className="text-sm text-eden-stone">
          Let {placedBy?.name ?? 'the requester'} know why {order.orderNumber} isn't being approved. This note will
          be visible on their order.
        </p>
        <textarea
          rows={3}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder="Reason for rejection…"
          className={`mt-3 w-full ${INPUT_CLASS}`}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRejectOpen(false)}
            className="rounded-lg border border-eden-sage px-4 py-2 text-sm font-medium text-eden-charcoal hover:bg-eden-cream"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={!rejectNote.trim()}
            className="rounded-lg bg-eden-berry px-4 py-2 text-sm font-semibold text-eden-cream hover:bg-eden-berry/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reject order
          </button>
        </div>
      </Modal>
    </div>
  );
}
