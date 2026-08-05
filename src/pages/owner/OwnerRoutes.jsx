import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ShieldAlert, Users } from 'lucide-react';
import StaffLayout from '../../components/staff/StaffLayout';
import OwnerDashboard from './OwnerDashboard';
import { AdminProvider } from '../../context/AdminContext';

export default function OwnerRoutes() {
  const menuItems = [
    { label: 'Master Control', path: '/owner', icon: ShieldAlert },
  ];

  return (
    // Wrap with AdminProvider so Owner can access and override Menu/Storage data easily
    <AdminProvider>
      <Routes>
        <Route element={<StaffLayout role="PEMILIK" menuItems={menuItems} />}>
          <Route index element={<OwnerDashboard />} />
        </Route>
      </Routes>
    </AdminProvider>
  );
}
