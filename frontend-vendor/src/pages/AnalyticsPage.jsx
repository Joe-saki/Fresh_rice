// src/pages/AnalyticsPage.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getVendorStats } from '../api/client';

// Mock weekly data (in production, fetch from API)
const weeklyData = [
  { day: 'Mon', orders: 12, revenue: 280 },
  { day: 'Tue', orders: 18, revenue: 420 },
  { day: 'Wed', orders: 15, revenue: 350 },
  { day: 'Thu', orders: 22, revenue: 510 },
  { day: 'Fri', orders: 28, revenue: 650 },
  { day: 'Sat', orders: 35, revenue: 820 },
  { day: 'Sun', orders: 20, revenue: 460 },
];

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: () => getVendorStats().then(r => r.data),
  });

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: stats ? `GHS ${stats.totalRevenueGHS.toFixed(2)}` : '—', sub: 'Platform total' },
          { label: 'Your Earnings', value: stats ? `GHS ${stats.vendorEarningsGHS.toFixed(2)}` : '—', sub: 'After 12% commission' },
          { label: 'Total Orders', value: stats?.totalOrders ?? '—', sub: 'Delivered' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="card">
            <div className="text-sm text-gray-500">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-6">Weekly Orders</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="orders" fill="#1DB954" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-6">Weekly Revenue (GHS)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card bg-yellow-50 border-yellow-200">
        <div className="text-sm font-medium text-yellow-800">💡 Commission Info</div>
        <div className="text-sm text-yellow-700 mt-1">
          CampusBite takes a 12% commission on each order. You receive 88% of each order's subtotal.
          Payouts are processed weekly to your MTN MoMo number.
        </div>
      </div>
    </div>
  );
}
