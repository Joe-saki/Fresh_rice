import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/client';

export default function EarningsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/vendors/me/dashboard').then(r => setStats(r.data)).catch(console.error);
  }, []);

  const chartData = [
    { month: 'Oct', revenue: 450 }, { month: 'Nov', revenue: 680 }, { month: 'Dec', revenue: 920 },
    { month: 'Jan', revenue: 1100 }, { month: 'Feb', revenue: 870 }, { month: 'Mar', revenue: 1250 },
  ];

  const commissionRate = stats?.vendor?.commissionRate || 0.12;
  const totalRev = stats?.totalRevenue || 0;
  const commission = totalRev * commissionRate;
  const payout = totalRev - commission;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Earnings & Payouts 💰</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `GHS ${totalRev.toFixed(2)}`, color: 'text-blue-600', emoji: '📈' },
          { label: `Platform Commission (${(commissionRate*100).toFixed(0)}%)`, value: `GHS ${commission.toFixed(2)}`, color: 'text-red-500', emoji: '💸' },
          { label: 'Your Payout', value: `GHS ${payout.toFixed(2)}`, color: 'text-green-600', emoji: '💵' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">{card.emoji}</div>
            <p className="text-gray-500 text-sm">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue Trend (GHS)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`GHS ${v}`, 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#1DB954" strokeWidth={3} dot={{ fill: '#1DB954' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
        <h3 className="font-bold text-green-800 mb-2">💳 MoMo Payout Info</h3>
        <p className="text-green-700 text-sm">Payouts are sent to <strong>{stats?.vendor?.momoNumber || 'your registered MoMo number'}</strong> every Monday by 12pm.</p>
        <p className="text-green-600 text-sm mt-2">Contact support on WhatsApp to update your payout number.</p>
      </div>
    </div>
  );
}
