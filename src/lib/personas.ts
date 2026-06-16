import type { Persona, Role } from './types';

export const PERSONAS: { label: string; persona: Persona }[] = [
  { label: 'Emma Hart — Orderer (Sky Media)', persona: { role: 'orderer', accountId: 'acc_sky', contactId: 'con_emma' } },
  { label: 'Raj Patel — Approver (Sky Media)', persona: { role: 'approver', accountId: 'acc_sky', contactId: 'con_raj' } },
  { label: 'Li Wei — Orderer (RSS)', persona: { role: 'orderer', accountId: 'acc_rss', contactId: 'con_li' } },
  { label: 'Tobi Adeyemi — Orderer · Catering widget + AI chat', persona: { role: 'orderer', contactId: 'con_widget_ai', useWidget: true, aiEnabled: true } },
  { label: 'Nadia Rossi — Orderer · Catering widget (no AI)', persona: { role: 'orderer', contactId: 'con_widget_std', useWidget: true, aiEnabled: false } },
  { label: 'Sam Okafor — Caterer Admin (Eden)', persona: { role: 'caterer_admin', contactId: 'con_sam' } },
  { label: 'Kim Nguyen — Kitchen (Eden)', persona: { role: 'kitchen', contactId: 'con_kim' } },
  { label: 'Dan Murphy — Driver (Eden)', persona: { role: 'driver', contactId: 'con_dan' } },
];

export const PERSONA_HOME_ROUTES: Record<Role, string> = {
  orderer: '/order',
  approver: '/approvals',
  caterer_admin: '/admin',
  kitchen: '/admin/production',
  driver: '/admin/delivery',
};
