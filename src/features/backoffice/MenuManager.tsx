import { addDays, format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Menu } from '../../lib/types';
import Table from '../../components/common/Table';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDays(days: number[]): string {
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(', ');
}

export default function MenuManager() {
  const navigate = useNavigate();
  const menus = useStore((s) => s.menus);
  const items = useStore((s) => s.items);
  const createMenu = useStore((s) => s.createMenu);
  const updateMenu = useStore((s) => s.updateMenu);

  const handleNewMenu = () => {
    const today = new Date();
    createMenu({
      name: 'New menu',
      description: '',
      serviceType: 'single',
      availableFrom: format(today, 'yyyy-MM-dd'),
      availableTo: format(addDays(today, 90), 'yyyy-MM-dd'),
      leadTimeHours: 24,
      cutoffTime: '10:00',
      availableDays: [1, 2, 3, 4, 5],
      minOrderValue: 0,
      minPersons: 1,
      active: true,
    });
    const created = useStore.getState().menus.at(-1);
    if (created) navigate(`/admin/menus/${created.id}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl text-eden-green">Menus</h1>
        <button
          type="button"
          onClick={handleNewMenu}
          className="rounded-lg bg-eden-green px-4 py-2 text-sm font-semibold text-eden-cream shadow-sm transition-colors hover:bg-eden-leaf"
        >
          New menu
        </button>
      </div>

      <div className="mt-6">
        <Table<Menu>
          rows={menus}
          columns={[
            {
              header: 'Menu',
              render: (m) => (
                <Link to={`/admin/menus/${m.id}`} className="font-medium text-eden-green hover:text-eden-leaf">
                  {m.name}
                </Link>
              ),
            },
            { header: 'Days', render: (m) => formatDays(m.availableDays) },
            {
              header: 'Window',
              render: (m) => `${format(new Date(m.availableFrom), 'd MMM yyyy')} – ${format(new Date(m.availableTo), 'd MMM yyyy')}`,
            },
            { header: 'Items', render: (m) => items.filter((i) => i.menuId === m.id).length },
            {
              header: 'Active',
              render: (m) => (
                <input
                  type="checkbox"
                  checked={m.active}
                  onChange={(e) => updateMenu(m.id, { active: e.target.checked })}
                  className="h-4 w-4 accent-eden-green"
                />
              ),
            },
            {
              header: 'Offline',
              render: (m) => (
                <input
                  type="checkbox"
                  checked={!!m.offline}
                  onChange={(e) => updateMenu(m.id, { offline: e.target.checked })}
                  className="h-4 w-4 accent-eden-green"
                />
              ),
            },
          ]}
          rowKey={(m) => m.id}
        />
      </div>
    </div>
  );
}
