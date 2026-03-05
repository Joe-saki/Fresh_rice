import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';

const StatCard = ({ emoji, label, value, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-800'}`}>{value}</p>
      </div>
      <div className="text-4xl">{emoji}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendors/me/dashboard')
      .then(r => { setStats(r.data); setIsOpen(r.data.vendor?.isOpen); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = async () => {
    if (!stats) return;
    try {
      const res = await api.patch(`/vendors/${stats.vendor.id}/toggle`);
      setIsOpen(res.data.isOpen);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-4xl animate-bounce">🍚</div></div>;

  const chartData = [
    { day: 'Mon', orders: 8 }, { day: 'Tue', orders: 14 }, { day: 'Wed', orders: 11 },
    { day: 'Thu', orders: 18 }, { day: 'Fri', orders: 22 }, { day: 'Sat', orders: 30 }, { day: 'Sun', orders: 19 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard 📊</h1>
          <p className="text-gray-500 mt-1">Welcome back, {stats?.vendor?.businessName}</p>
        </div>
        <button onClick={toggleOpen} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${isOpen ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
          <span>{isOpen ? '🟢' : '🔴'}</span>
          <span>{isOpen ? 'Open for Orders' : 'Closed'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard emoji="📦" label="Today's Orders" value={stats?.todayOrders || 0} color="text-blue-600" />
        <StatCard emoji="⏳" label="Pending" value={stats?.pendingOrders || 0} color="text-orange-500" />
        <StatCard emoji="📈" label="Total Orders" value={stats?.totalOrders || 0} />
        <StatCard emoji="💰" label="Total Revenue" value={`GHS ${stats?.totalRevenue?.toFixed(2) || '0.00'}`} color="text-green-600" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Orders This Week</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="#1DB954" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Tips */}
      <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
        <h3 className="font-bold text-green-800 mb-3">💡 Quick Tips</h3>
        <ul className="space-y-2 text-sm text-green-700">
          <li>• Keep your menu up to date — unavailable items frustrate students</li>
          <li>• Respond to orders within 2 minutes to avoid cancellations</li>
          <li>• Add photos to your food items to increase orders by 30%+</li>
        </ul>
      </div>
    </div>
  );
}
