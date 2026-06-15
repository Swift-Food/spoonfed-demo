import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { Account } from '../../lib/types';
import { formatMoney } from '../../lib/money';
import Table from '../../components/common/Table';

export default function AccountList() {
  const accounts = useStore((s) => s.accounts);
  const contacts = useStore((s) => s.contacts);

  return (
    <div>
      <h1 className="font-serif text-3xl text-eden-green">Accounts</h1>

      <div className="mt-6">
        <Table<Account>
          rows={accounts}
          columns={[
            {
              header: 'Account',
              render: (a) => (
                <Link to={`/admin/accounts/${a.id}`} className="font-medium text-eden-green hover:text-eden-leaf">
                  {a.name}
                </Link>
              ),
            },
            { header: 'Payment terms', render: (a) => `${a.paymentTermsDays} days` },
            {
              header: 'Approval threshold',
              render: (a) => (a.requiresApproval ? `Over ${formatMoney(a.approvalThreshold)}` : 'Not required'),
            },
            { header: 'PO required', render: (a) => (a.poRequired ? 'Yes' : 'No') },
            { header: 'Contacts', render: (a) => contacts.filter((c) => c.accountId === a.id).length },
            { header: 'Status', render: (a) => (a.active ? 'Active' : 'Inactive') },
          ]}
          rowKey={(a) => a.id}
        />
      </div>
    </div>
  );
}
