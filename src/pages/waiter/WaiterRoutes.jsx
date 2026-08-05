import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, BookOpen, Coffee, CalendarDays } from 'lucide-react';
import StaffLayout from '../../components/staff/StaffLayout';
import WaiterDashboard from './WaiterDashboard';
import ReservationBoard from '../../components/reservations/ReservationBoard';
import OrderManagement from './OrderManagement';
import ServiceWorkflow from './ServiceWorkflow';
import MenuViewer from './MenuViewer';
import AdditionalOrders from './AdditionalOrders';

export default function WaiterRoutes() {
  const menuItems = [
    { label: 'Overview & Tables', path: '/waiter', icon: LayoutDashboard },
    { label: 'Walk-Ins & Sessions', path: '/waiter/reservations', icon: CalendarDays },
    { label: 'Take Orders', path: '/waiter/orders', icon: ClipboardList },
    { label: 'Additional Orders', path: '/waiter/add-on', icon: Coffee },
    { label: 'Service Workflow', path: '/waiter/service', icon: UtensilsCrossed },
    { label: 'Menu Reference', path: '/waiter/menu', icon: BookOpen },
  ];

  return (
    <Routes>
      <Route element={<StaffLayout role="waiter" menuItems={menuItems} />}>
        <Route index element={<WaiterDashboard />} />
        <Route path="reservations" element={<ReservationBoard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="add-on" element={<AdditionalOrders />} />
        <Route path="service" element={<ServiceWorkflow />} />
        <Route path="menu" element={<MenuViewer />} />
      </Route>
    </Routes>
  );
}
