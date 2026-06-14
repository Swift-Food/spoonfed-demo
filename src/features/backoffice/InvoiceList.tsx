import { useStore } from '../../store/useStore';
import type { Invoice } from '../../lib/types';
import { formatFriendlyDate } from '../../lib/dates';
import Money from '../../components/common/Money';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';

const INVOICE_STATUS_LABELS: Record<Invoice['status'], string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
};

const INVOICE_STATUS_STYLES: Record<Invoice['status'], string> = {
  draft: 'bg-eden-stone/15 text-eden-stone',
  sent: 'bg-eden-amber/15 text-eden-amber',
  paid: 'bg-eden-leaf/15 text-eden-leaf',
};

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${INVOICE_STATUS_STYLES[status]}`}>
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

export default function InvoiceList() {
  const orders = useStore((s) => s.orders);
  const accounts = useStore((s) => s.accounts);
  const invoices = useStore((s) => s.invoices);
  const generateInvoice = useStore((s) => s.generateInvoice);
  const markInvoiceSent = useStore((s) => s.markInvoiceSent);
  const markInvoicePaid = useStore((s) => s.markInvoicePaid);

  const awaitingInvoice = orders.filter((o) => o.status === 'delivered' && !invoices.some((i) => i.orderId === o.id));

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">Invoices</h1>

      <div className="mt-6">
        <h2 className="font-serif text-lg text-eden-green">Awaiting invoice</h2>
        {awaitingInvoice.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nothing to invoice" description="All delivered orders have an invoice." />
          </div>
        ) : (
          <div className="mt-3">
            <Table
              columns={[
                { header: 'Order', render: (o) => o.orderNumber },
                { header: 'Account', render: (o) => accounts.find((a) => a.id === o.accountId)?.name ?? 'Unknown account' },
                { header: 'Total', render: (o) => <Money amount={o.total} /> },
                {
                  header: '',
                  render: (o) => (
                    <button
                      type="button"
                      onClick={() => generateInvoice(o.id)}
                      className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
                    >
                      Generate invoice
                    </button>
                  ),
                },
              ]}
              rows={awaitingInvoice}
              rowKey={(o) => o.id}
            />
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-lg text-eden-green">Invoices</h2>
        {invoices.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No invoices yet" description="Invoices generated from delivered orders will appear here." />
          </div>
        ) : (
          <div className="mt-3">
            <Table
              columns={[
                { header: 'Invoice', render: (i) => i.invoiceNumber },
                { header: 'Account', render: (i) => accounts.find((a) => a.id === i.accountId)?.name ?? 'Unknown account' },
                { header: 'Order', render: (i) => orders.find((o) => o.id === i.orderId)?.orderNumber ?? '—' },
                { header: 'Issue date', render: (i) => formatFriendlyDate(i.issueDate) },
                { header: 'Due date', render: (i) => formatFriendlyDate(i.dueDate) },
                { header: 'Total', render: (i) => <Money amount={i.total} /> },
                { header: 'Status', render: (i) => <InvoiceStatusBadge status={i.status} /> },
                {
                  header: '',
                  render: (i) =>
                    i.status === 'draft' ? (
                      <button
                        type="button"
                        onClick={() => markInvoiceSent(i.id)}
                        className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
                      >
                        Mark sent
                      </button>
                    ) : i.status === 'sent' ? (
                      <button
                        type="button"
                        onClick={() => markInvoicePaid(i.id)}
                        className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
                      >
                        Mark paid
                      </button>
                    ) : null,
                },
              ]}
              rows={invoices}
              rowKey={(i) => i.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
