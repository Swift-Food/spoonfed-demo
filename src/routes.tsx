import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store/useStore';
import type { Role } from './lib/types';
import AppShell from './components/layout/AppShell';
import { PERSONA_HOME_ROUTES } from './lib/personas';

import PersonaPicker from './features/customer/PersonaPicker';
import DatePicker from './features/customer/DatePicker';
import MenuBrowse from './features/customer/MenuBrowse';
import MenuDetail from './features/customer/MenuDetail';
import Cart from './features/customer/Cart';
import Checkout from './features/customer/Checkout';
import MyOrders from './features/customer/MyOrders';
import OrderTrack from './features/customer/OrderTrack';

import ApprovalQueue from './features/approver/ApprovalQueue';
import ApprovalDetail from './features/approver/ApprovalDetail';

import Dashboard from './features/backoffice/Dashboard';
import Calendar from './features/backoffice/Calendar';
import CreateOrderOnBehalf from './features/backoffice/CreateOrderOnBehalf';
import OrderDetailAdmin from './features/backoffice/OrderDetailAdmin';
import ProductionList from './features/backoffice/ProductionList';
import DeliveryRunSheet from './features/backoffice/DeliveryRunSheet';
import MenuManager from './features/backoffice/MenuManager';
import MenuEditor from './features/backoffice/MenuEditor';
import AccountList from './features/backoffice/AccountList';
import AccountDetail from './features/backoffice/AccountDetail';
import InvoiceList from './features/backoffice/InvoiceList';

function RequireRole({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const persona = useStore((s) => s.persona);
  if (!allow.includes(persona.role)) {
    return <Navigate to={PERSONA_HOME_ROUTES[persona.role]} replace />;
  }
  return <>{children}</>;
}

function HomeRedirect() {
  const persona = useStore((s) => s.persona);
  return <Navigate to={PERSONA_HOME_ROUTES[persona.role]} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PersonaPicker />} />
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomeRedirect />} />

        <Route path="order" element={<RequireRole allow={['orderer', 'caterer_admin']}><DatePicker /></RequireRole>} />
        <Route path="order/menus" element={<RequireRole allow={['orderer', 'caterer_admin']}><MenuBrowse /></RequireRole>} />
        <Route path="order/menu/:menuId" element={<RequireRole allow={['orderer', 'caterer_admin']}><MenuDetail /></RequireRole>} />
        <Route path="cart" element={<RequireRole allow={['orderer', 'caterer_admin']}><Cart /></RequireRole>} />
        <Route path="checkout" element={<RequireRole allow={['orderer', 'caterer_admin']}><Checkout /></RequireRole>} />
        <Route path="orders" element={<RequireRole allow={['orderer']}><MyOrders /></RequireRole>} />
        <Route path="orders/:id" element={<RequireRole allow={['orderer']}><OrderTrack /></RequireRole>} />

        <Route path="approvals" element={<RequireRole allow={['approver']}><ApprovalQueue /></RequireRole>} />
        <Route path="approvals/:id" element={<RequireRole allow={['approver']}><ApprovalDetail /></RequireRole>} />

        <Route path="admin" element={<RequireRole allow={['caterer_admin']}><Dashboard /></RequireRole>} />
        <Route path="admin/calendar" element={<RequireRole allow={['caterer_admin']}><Calendar /></RequireRole>} />
        <Route path="admin/orders/new" element={<RequireRole allow={['caterer_admin']}><CreateOrderOnBehalf /></RequireRole>} />
        <Route path="admin/orders/:id" element={<RequireRole allow={['caterer_admin']}><OrderDetailAdmin /></RequireRole>} />
        <Route path="admin/production" element={<RequireRole allow={['caterer_admin', 'kitchen']}><ProductionList /></RequireRole>} />
        <Route path="admin/delivery" element={<RequireRole allow={['caterer_admin', 'driver']}><DeliveryRunSheet /></RequireRole>} />
        <Route path="admin/menus" element={<RequireRole allow={['caterer_admin']}><MenuManager /></RequireRole>} />
        <Route path="admin/menus/:id" element={<RequireRole allow={['caterer_admin']}><MenuEditor /></RequireRole>} />
        <Route path="admin/accounts" element={<RequireRole allow={['caterer_admin']}><AccountList /></RequireRole>} />
        <Route path="admin/accounts/:id" element={<RequireRole allow={['caterer_admin']}><AccountDetail /></RequireRole>} />
        <Route path="admin/invoices" element={<RequireRole allow={['caterer_admin']}><InvoiceList /></RequireRole>} />

        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
}
