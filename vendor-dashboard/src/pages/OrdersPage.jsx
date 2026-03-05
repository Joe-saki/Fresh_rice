import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';

const STATUS_COLORS = { CONFIRMED: 'bg-blue-100 text-blue-700', PREPARING: 'bg-yellow-100 text-yellow-700', READY: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };
const NEXT_STATUS = { CONFIRMED: 'PREPARING', PREPARING: 'READY', READY: 'PICKED_UP' };
const NEXT_LABEL = { CONFIRMED: '👨‍🍳 Start Preparing', PREPARING: '📦 Mark Ready', READY: '✅ Rider Picked Up' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/vendor/active');
      setOrders(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const socket = io('http://localhost:5000');
    socket.on('order_status_update', fetchOrders);
    socket.on('new_order', fetchOrders);
    return () => socket.disconnect();
  }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="text-4xl animate-bounce">📋</div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Active Orders 📋</h1>
        <button onClick={fetchOrders} className="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-medium hover:bg-green-100 transition-colors">🔄 Refresh</button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">😴</div>
          <p className="text-gray-500 text-lg">No active orders right now</p>
          <p className="text-gray-400 text-sm mt-2">New orders will appear here automatically</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800">#{order.id.slice(0, 8).toUpperCase()}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>{order.status}</span>
              </div>

              <div className="space-y-1 mb-3">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.foodItem?.name}</span>
                    <span className="text-gray-800 font-medium">GHS {item.subtotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-green-600">GHS {order.totalGHS?.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-3">
                <p>📍 {order.deliveryAddress}</p>
                <p>👤 {order.student?.user?.name} · {order.student?.user?.phone}</p>
                {order.specialNote && <p className="mt-1 text-orange-600">📝 {order.specialNote}</p>}
              </div>

              <div className="flex gap-2">
                {NEXT_STATUS[order.status] && (
                  <button onClick={() => updateStatus(order.id, NEXT_STATUS[order.status])} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                    {NEXT_LABEL[order.status]}
                  </button>
                )}
                <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
