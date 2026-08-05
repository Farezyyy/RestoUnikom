import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Public
import LandingPage from './pages/public/LandingPage';
import FineDiningInfo from './pages/public/FineDiningInfo';
import MenuPage from './pages/public/MenuPage';
// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// Staff Routes
import WaiterRoutes from './pages/waiter/WaiterRoutes';
import ChefRoutes from './pages/chef/ChefRoutes';
import AdminRoutes from './pages/admin/AdminRoutes';
import OwnerRoutes from './pages/owner/OwnerRoutes';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/what-is-fine-dining" element={<FineDiningInfo />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Waiter Routes */}
      <Route path="/waiter/*" element={<WaiterRoutes />} />
      {/* Chef Routes */}
      <Route path="/chef/*" element={<ChefRoutes />} />
      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      {/* Owner Routes */}
      <Route path="/owner/*" element={<OwnerRoutes />} />
    </Routes>
  );
}

export default App;