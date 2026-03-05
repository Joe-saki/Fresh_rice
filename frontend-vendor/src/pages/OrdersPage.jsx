// src/pages/OrdersPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVendorOrders } from '../api/client';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', PREPARING: 'badge-preparing',
  READY: 'badge-ready', PICKED_UP: 'badge-picked_up', DELIVERED: 'badge-delivered', CANCELLED: 'badge-cancelled',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-orders', page],
    queryFn: () => getVendorOrders(page).then(r => r.data),
  });

  const orders = data?.orders || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Order History</h1>
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-sm font-semibold text-gray-900">#{order.orderNumber}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{order.student?.user?.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {order.items?.map(i => `${i.quantity}× ${i.foodItem?.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-green-600">GHS {order.totalGHS?.toFixed(2)}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">{order.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40">← Previous</button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 30} className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
