import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './useStore';

const RAJ = { role: 'approver' as const, accountId: 'acc_sky', contactId: 'con_raj' };

beforeEach(() => {
  useStore.getState().resetDemo();
});

describe('rejectOrder', () => {
  it('returns EDN-1002 to draft with a rejection note and notifies the orderer', () => {
    useStore.getState().setPersona(RAJ);
    useStore.getState().rejectOrder('order_1002', 'Budget needs trimming before approval.');

    const order = useStore.getState().orders.find((o) => o.id === 'order_1002')!;
    expect(order.status).toBe('draft');
    expect(order.approvalStatus).toBe('rejected');
    expect(order.approvalNote).toBe('Budget needs trimming before approval.');
    expect(order.history.at(-1)?.note).toContain('Budget needs trimming before approval.');

    const notification = useStore.getState().notifications.find((n) => n.type === 'rejected' && n.orderId === 'order_1002');
    expect(notification?.recipientRole).toBe('orderer');
  });
});

describe('approveOrder', () => {
  it('moves EDN-1002 to submitted, approved, and notifies the orderer and caterer_admin', () => {
    useStore.getState().setPersona(RAJ);
    useStore.getState().approveOrder('order_1002');

    const order = useStore.getState().orders.find((o) => o.id === 'order_1002')!;
    expect(order.status).toBe('submitted');
    expect(order.approvalStatus).toBe('approved');

    const notifications = useStore.getState().notifications.filter((n) => n.orderId === 'order_1002');
    expect(notifications.some((n) => n.type === 'approved' && n.recipientRole === 'orderer')).toBe(true);
    expect(notifications.some((n) => n.type === 'order_received' && n.recipientRole === 'caterer_admin')).toBe(true);
  });
});

describe('updateItem', () => {
  it('does not mutate snapshots on existing order lines when an item price changes', () => {
    useStore.getState().updateItem('item_sandwich_platter', { price: 35, name: 'Updated Sandwich Platter' });

    const item = useStore.getState().items.find((i) => i.id === 'item_sandwich_platter')!;
    expect(item.price).toBe(35);
    expect(item.name).toBe('Updated Sandwich Platter');

    const order = useStore.getState().orders.find((o) => o.id === 'order_1003')!;
    const line = order.lines.find((l) => l.itemId === 'item_sandwich_platter')!;
    expect(line.unitPriceSnapshot).toBe(28);
    expect(line.nameSnapshot).toBe('Seasonal Sandwich Platter');
  });
});
