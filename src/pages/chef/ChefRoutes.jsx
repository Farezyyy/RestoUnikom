import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MonitorPlay, ClipboardList } from 'lucide-react';
import StaffLayout from '../../components/staff/StaffLayout';
import KitchenDisplay from './KitchenDisplay';
import InventoryRecipes from './InventoryRecipes';

export default function ChefRoutes() {
  const menuItems = [
    { label: 'Kitchen Display (KDS)', path: '/chef/kds', icon: MonitorPlay },
    { label: 'Inventory & Recipes', path: '/chef/inventory', icon: ClipboardList },
  ];

  return (
    <Routes>
      <Route element={<StaffLayout role="chef" menuItems={menuItems} />}>
        <Route index element={<Navigate to="kds" replace />} />
        <Route path="kds" element={<KitchenDisplay />} />
        <Route path="inventory" element={<InventoryRecipes />} />
      </Route>
    </Routes>
  );
}
