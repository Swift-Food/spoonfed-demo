import { useMemo } from 'react';
import { TrendingUp, ShoppingBag, Users, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatMoney } from '../../lib/money';
import type { OrderStatus } from '../../lib/types';

// ── Palette ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  draft:            { label: 'Draft',            color: '#EDE6D6' },
  pending_approval: { label: 'Pending Approval',  color: '#C98A3A' },
  submitted:        { label: 'Submitted',         color: '#A7C4A0' },
  confirmed:        { label: 'Confirmed',          color: '#4E944F' },
  in_production:    { label: 'In Production',     color: '#1F4D2E' },
  out_for_delivery: { label: 'Out for Delivery',  color: '#9C3D54' },
  delivered:        { label: 'Delivered',          color: '#2B2B26' },
  invoiced:         { label: 'Invoiced',           color: '#6F6F66' },
  cancelled:        { label: 'Cancelled',          color: '#D1CDC4' },
};

const ACCOUNT_COLORS = ['#1F4D2E', '#4E944F', '#C98A3A'] as const;
const MENU_COLORS    = ['#1F4D2E', '#4E944F', '#C98A3A', '#9C3D54', '#A7C4A0'] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub,
}: {
  icon: LucideIcon; label: string; value: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-eden-sage/30 p-6 shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2 text-eden-stone">
        <Icon size={14} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">{label}</span>
      </div>
      <p className="font-serif text-4xl text-eden-green leading-none tracking-tight">{value}</p>
      {sub && <p className="text-xs text-eden-stone">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-eden-sage/30 p-6 shadow-sm">
      <h2 className="font-serif text-xl text-eden-green mb-5">{title}</h2>
      {children}
    </div>
  );
}

function HBar({
  label, value, maxValue, color, formatted, sub,
}: {
  label: string; value: number; maxValue: number;
  color: string; formatted: string; sub?: string;
}) {
  const pct = maxValue > 0 ? Math.max(2, (value / maxValue) * 100) : 2;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span
          className="text-sm text-eden-charcoal font-medium truncate max-w-[55%]"
          title={label}
        >
          {label}
        </span>
        <div className="text-right leading-tight">
          <span className="text-sm font-semibold text-eden-green">{formatted}</span>
          {sub && <span className="text-xs text-eden-stone ml-1.5">{sub}</span>}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-eden-sand overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0) {
    return <p className="text-eden-stone text-sm">No data yet.</p>;
  }

  const cumSums = segments.reduce<number[]>((acc, seg) => {
    acc.push((acc[acc.length - 1] ?? 0) + seg.value);
    return acc;
  }, []);
  const stops = segments.map((seg, i) => {
    const start = ((cumSums[i - 1] ?? 0) / total) * 360;
    const end   = (cumSums[i] / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });
  const gradient = `conic-gradient(${stops.join(', ')})`;

  return (
    <div className="flex items-center gap-8">
      <div className="relative flex-shrink-0 w-32 h-32">
        <div className="w-full h-full rounded-full" style={{ background: gradient }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[68px] h-[68px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="font-serif text-xl text-eden-green leading-none">{total}</span>
            <span className="text-[9px] text-eden-stone uppercase tracking-wide mt-0.5">orders</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 min-w-0 flex-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-eden-stone truncate flex-1" title={seg.label}>
              {seg.label}
            </span>
            <span className="text-xs font-semibold text-eden-charcoal ml-1">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const orders   = useStore((s) => s.orders);
  const accounts = useStore((s) => s.accounts);
  const items    = useStore((s) => s.items);
  const menus    = useStore((s) => s.menus);
  const invoices = useStore((s) => s.invoices);

  // Active = non-quote, non-cancelled
  const activeOrders = useMemo(
    () => orders.filter((o) => !o.isQuote && o.status !== 'cancelled'),
    [orders],
  );

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue  = activeOrders.reduce((s, o) => s + o.total, 0);
    const orderCount    = activeOrders.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const totalHeadcount = activeOrders
      .filter((o) =>
        ['confirmed', 'in_production', 'out_for_delivery', 'delivered', 'invoiced'].includes(o.status),
      )
      .reduce((s, o) => s + o.headcount, 0);
    return { totalRevenue, orderCount, avgOrderValue, totalHeadcount };
  }, [activeOrders]);

  // Revenue by account
  const revenueByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of activeOrders) {
      map.set(o.accountId, (map.get(o.accountId) ?? 0) + o.total);
    }
    return [...map.entries()]
      .map(([id, revenue]) => ({
        name: accounts.find((a) => a.id === id)?.name ?? id,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [activeOrders, accounts]);

  const maxAccountRevenue = revenueByAccount[0]?.revenue ?? 1;

  // Orders by status (all non-quote orders, including cancelled)
  const pipelineData = useMemo(() => {
    const allNonQuote = orders.filter((o) => !o.isQuote);
    const total = allNonQuote.length;
    const map = new Map<string, number>();
    for (const o of allNonQuote) {
      map.set(o.status, (map.get(o.status) ?? 0) + 1);
    }
    const breakdown = (Object.entries(STATUS_CONFIG) as [OrderStatus, { label: string; color: string }][])
      .map(([status, cfg]) => ({ status, ...cfg, count: map.get(status) ?? 0 }))
      .filter((s) => s.count > 0);
    return { total, breakdown };
  }, [orders]);

  // Top 5 items by revenue
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; qty: number }>();
    for (const o of activeOrders) {
      for (const line of o.lines) {
        const ex = map.get(line.itemId) ?? { name: line.nameSnapshot, revenue: 0, qty: 0 };
        ex.revenue += line.lineTotal;
        ex.qty     += line.qty;
        map.set(line.itemId, ex);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [activeOrders]);

  const maxItemRevenue = topItems[0]?.revenue ?? 1;

  // Menu popularity by unique orders that include each menu
  const menuSegments = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const o of activeOrders) {
      const seen = new Set<string>();
      for (const line of o.lines) {
        const item = items.find((i) => i.id === line.itemId);
        if (!item || seen.has(item.menuId)) continue;
        seen.add(item.menuId);
        const menuName = menus.find((m) => m.id === item.menuId)?.name ?? item.menuId;
        const ex = map.get(item.menuId) ?? { name: menuName, count: 0 };
        ex.count += 1;
        map.set(item.menuId, ex);
      }
    }
    return [...map.values()]
      .sort((a, b) => b.count - a.count)
      .map((seg, i) => ({
        label: seg.name,
        value: seg.count,
        color: MENU_COLORS[i % MENU_COLORS.length],
      }));
  }, [activeOrders, items, menus]);

  // Invoice summary
  const invoiceSummary = useMemo(() => {
    const counts = { draft: 0, sent: 0, paid: 0 };
    const values = { draft: 0, sent: 0, paid: 0 };
    for (const inv of invoices) {
      counts[inv.status] += 1;
      values[inv.status] += inv.total;
    }
    return { counts, values, outstanding: values.draft + values.sent };
  }, [invoices]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="border-b border-eden-sage/30 pb-5">
        <h1 className="font-serif text-3xl text-eden-green">Analytics</h1>
        <p className="mt-1 text-sm text-eden-stone">Business overview across all accounts and orders.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Total Order Value"
          value={formatMoney(kpis.totalRevenue)}
          sub="all active orders"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Active Orders"
          value={String(kpis.orderCount)}
          sub="excl. quotes & cancelled"
        />
        <KpiCard
          icon={BarChart2}
          label="Avg Order Value"
          value={formatMoney(kpis.avgOrderValue)}
          sub="per active order"
        />
        <KpiCard
          icon={Users}
          label="Headcount Served"
          value={String(kpis.totalHeadcount)}
          sub="confirmed through invoiced"
        />
      </div>

      {/* Revenue by Account + Order Status Pipeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Revenue by Account">
          {revenueByAccount.length === 0 ? (
            <p className="text-eden-stone text-sm">No data yet.</p>
          ) : (
            <div className="space-y-5">
              {revenueByAccount.map(({ name, revenue }, i) => (
                <HBar
                  key={name}
                  label={name}
                  value={revenue}
                  maxValue={maxAccountRevenue}
                  color={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
                  formatted={formatMoney(revenue)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Order Status Pipeline">
          {/* Segmented horizontal bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-5 border border-black/5">
            {pipelineData.breakdown.map((s) => (
              <div
                key={s.status}
                title={`${s.label}: ${s.count}`}
                style={{
                  width: `${(s.count / pipelineData.total) * 100}%`,
                  backgroundColor: s.color,
                }}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {pipelineData.breakdown.map((s) => (
              <div key={s.status} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-black/10"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs text-eden-stone truncate">{s.label}</span>
                </div>
                <span className="text-xs font-semibold text-eden-charcoal tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Top Items + Menu Popularity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Top Items by Revenue">
          {topItems.length === 0 ? (
            <p className="text-eden-stone text-sm">No data yet.</p>
          ) : (
            <div className="space-y-5">
              {topItems.map(({ name, revenue, qty }, i) => (
                <HBar
                  key={name}
                  label={name}
                  value={revenue}
                  maxValue={maxItemRevenue}
                  color={i === 0 ? '#1F4D2E' : '#4E944F'}
                  formatted={formatMoney(revenue)}
                  sub={`${qty} units`}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Menu Popularity">
          <DonutChart segments={menuSegments} />
        </SectionCard>
      </div>

      {/* Invoice Summary */}
      <div>
        <h2 className="font-serif text-xl text-eden-green mb-4">Invoice Summary</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              {
                key: 'draft' as const,
                label: 'Draft',
                valueColor: 'text-eden-stone',
                border: 'border-eden-sand',
              },
              {
                key: 'sent' as const,
                label: 'Sent',
                valueColor: 'text-eden-amber',
                border: 'border-eden-amber/40',
              },
              {
                key: 'paid' as const,
                label: 'Paid',
                valueColor: 'text-eden-leaf',
                border: 'border-eden-leaf/40',
              },
            ] as const
          ).map(({ key, label, valueColor, border }) => (
            <div key={key} className={`rounded-2xl bg-white border p-5 shadow-sm ${border}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-eden-stone mb-3">
                {label}
              </p>
              <p className={`font-serif text-4xl leading-none tracking-tight ${valueColor}`}>
                {invoiceSummary.counts[key]}
              </p>
              <p className="text-sm text-eden-stone mt-2">
                {formatMoney(invoiceSummary.values[key])}
              </p>
            </div>
          ))}
        </div>
        {invoiceSummary.outstanding > 0 && (
          <p className="mt-3 text-sm text-eden-stone">
            <span className="font-semibold text-eden-amber">
              {formatMoney(invoiceSummary.outstanding)}
            </span>{' '}
            outstanding across draft &amp; sent invoices.
          </p>
        )}
      </div>

    </div>
  );
}
