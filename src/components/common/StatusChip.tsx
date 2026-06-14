import type { OrderStatus } from '../../lib/types';
import { STATUS_LABELS } from '../../lib/stateMachine';

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft: 'bg-eden-stone/15 text-eden-stone',
  pending_approval: 'bg-eden-amber/15 text-eden-amber',
  submitted: 'bg-eden-leaf/15 text-eden-leaf',
  confirmed: 'bg-eden-green/10 text-eden-green',
  in_production: 'bg-eden-sage text-eden-green',
  out_for_delivery: 'bg-eden-leaf/15 text-eden-leaf',
  delivered: 'bg-eden-green/10 text-eden-green',
  invoiced: 'bg-eden-stone/15 text-eden-stone',
  cancelled: 'bg-eden-berry/15 text-eden-berry',
};

export default function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
