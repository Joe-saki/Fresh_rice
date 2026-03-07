import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/orders', icon: '📋', label: 'Orders' },
  { path: '/menu', icon: '🍽️', label: 'Menu' },
  { path: '/earnings', icon: '💰', label: 'Earnings' },
];

export default function Layout({ children, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-white border-r border-gray-100 flex flex-col transition-all duration-200`}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-2xl">🍚</span>
          {sidebarOpen && <span className="font-bold text-lg text-gray-800">CampusBite</span>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${location.pathname === item.path ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button onClick={onLogout} className="flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors">
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
