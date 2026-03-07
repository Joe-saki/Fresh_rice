import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import MenuPage from './pages/MenuPage';
import EarningsPage from './pages/EarningsPage';
import Layout from './components/Layout';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('vendor_token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('vendor_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    setToken(null);
  };

  if (!token) return <LoginPage onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
