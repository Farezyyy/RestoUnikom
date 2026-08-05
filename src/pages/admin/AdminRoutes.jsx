import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, CreditCard, Utensils, Receipt, Package, Truck } from 'lucide-react';
import StaffLayout from '../../components/staff/StaffLayout';
import AdminDashboard from './AdminDashboard';
import ReservationBoard from '../../components/reservations/ReservationBoard';
import ReservationDetail from './ReservationDetail';
import PaymentSystem from './PaymentSystem';
import MenuManager from './MenuManager';
import StorageManager from './StorageManager';
import RestockRoutine from './RestockRoutine';
import TransactionHistory from './TransactionHistory';

import { AdminProvider } from '../../context/AdminContext';

export default function AdminRoutes() {
  const menuItems = [
    { label: 'Dashboard & Stats', path: '/admin', icon: LayoutDashboard },
    { label: 'Reservations', path: '/admin/reservations', icon: CalendarDays },
    { label: 'Cashier & Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Transaction History', path: '/admin/history', icon: Receipt },
    { label: 'Menu Management', path: '/admin/menu', icon: Utensils },
    { label: 'Storage & Ingredients', path: '/admin/storage', icon: Package },
    { label: 'Restock Routine', path: '/admin/restock', icon: Truck },
  ];

  return (
    <AdminProvider>
      <Routes>
        <Route element={<StaffLayout role="admin" menuItems={menuItems} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reservations" element={<ReservationBoard />} />
          <Route path="reservations/:id" element={<ReservationDetail />} />
          <Route path="payments" element={<PaymentSystem />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="storage" element={<StorageManager />} />
          <Route path="restock" element={<RestockRoutine />} />
        </Route>
      </Routes>
    </AdminProvider>
  );
}
