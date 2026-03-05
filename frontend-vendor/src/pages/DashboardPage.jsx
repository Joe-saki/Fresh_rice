// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, ShoppingBag, Star, DollarSign, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { getVendorStats, getActiveOrders, updateOrderStatus, toggleVendorOpen } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  PREPARING: 'badge-preparing',
  READY: 'badge-ready',
  PICKED_UP: 'badge-picked_up',
  DELIVERED: 'badge-delivered',
  CANCELLED: 'badge-cancelled',
};

const STATUS_NEXT = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
};

export default function DashboardPage() {
  const { vendor, updateVendor } = useAuthStore();
  const queryClient = useQueryClient();
  const [togglingOpen, setTogglingOpen] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: () => getVendorStats().then(r => r.data),
    refetchInterval: 60000,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['active-orders'],
    queryFn: () => getActiveOrders().then(r => r.data),
    refetchInterval: 10000,
  });

  // Real-time socket
  useEffect(() => {
    if (!vendor?.id) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('join_vendor', { vendorId: vendor.id });
    socket.on('new_order', () => {
      queryClient.invalidateQueries(['active-orders']);
      queryClient.invalidateQueries(['vendor-stats']);
      // Play notification sound
      try { new Audio('https://www.soundjay.com/buttons/sounds/button-3.mp3').play(); } catch {}
    });
    socket.on('payment_confirmed', () => queryClient.invalidateQueries(['active-orders']));
    return () => socket.disconnect();
  }, [vendor?.id]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries(['active-orders']);
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  const handleToggleOpen = async () => {
    setTogglingOpen(true);
    try {
      const { data } = await toggleVendorOpen();
      updateVendor({ isOpen: data.isOpen });
    } catch (err) {
      alert('Failed to toggle status');
    } finally {
      setTogglingOpen(false);
    }
  };

  const stats = statsData?.stats;
  const activeOrders = ordersData?.orders || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleToggleOpen}
          disabled={togglingOpen}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            vendor?.isOpen
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {vendor?.isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {vendor?.isOpen ? 'Open for orders' : 'Closed'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: stats?.todayOrders ?? '—', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Your Earnings', value: stats ? `GHS ${stats.vendorEarningsGHS.toFixed(2)}` : '—', icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
          { label: 'Rating', value: stats ? `${vendor?.rating?.toFixed(1) || '0.0'} ⭐` : '—', icon: Star, color: 'bg-yellow-50 text-yellow-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`inline-flex p-2 rounded-xl ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Live Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Live Orders</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {activeOrders.length} active
          </div>
        </div>

        {ordersLoading ? (
          <div className="card text-center py-12 text-gray-400">Loading orders...</div>
        ) : activeOrders.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">🍽️</div>
            <div className="text-gray-500 font-medium">No active orders right now</div>
            <div className="text-gray-400 text-sm mt-1">New orders will appear here automatically</div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="card border-l-4 border-l-green-400">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-gray-900">#{order.orderNumber}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {order.student?.user?.name} • {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-green-600">GHS {order.totalGHS.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">× {item.quantity} {item.foodItem?.name}</span>
                      <span className="text-gray-500">GHS {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mb-4">
                    📝 {order.notes}
                  </div>
                )}

                {/* Actions */}
                {STATUS_NEXT[order.status] && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStatusUpdate(order.id, STATUS_NEXT[order.status])}
                      className="flex-1 btn-primary text-sm"
                    >
                      Mark as {STATUS_NEXT[order.status]}
                    </button>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
