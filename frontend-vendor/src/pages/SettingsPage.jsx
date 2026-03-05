// src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import { updateVendor } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { vendor, updateVendor: updateStore } = useAuthStore();
  const [form, setForm] = useState({
    businessName: vendor?.businessName || '',
    description: vendor?.description || '',
    address: vendor?.address || '',
    openingTime: vendor?.openingTime || '07:00',
    closingTime: vendor?.closingTime || '21:00',
    category: vendor?.category || 'General',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateVendor(form);
      updateStore(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-lg font-semibold border-b pb-4">Business Profile</h2>
        {[
          { label: 'Business Name', key: 'businessName', type: 'text' },
          { label: 'Address', key: 'address', type: 'text' },
          { label: 'Category', key: 'category', type: 'text', placeholder: 'e.g. Local Ghanaian' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type} value={form[key]} placeholder={placeholder}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            rows={3} placeholder="Tell students about your food..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
            <input type="time" value={form.openingTime}
              onChange={e => setForm({ ...form, openingTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
            <input type="time" value={form.closingTime}
              onChange={e => setForm({ ...form, closingTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </form>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold border-b pb-4">Support</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>📞 Vendor Support: <a href="tel:+233200000000" className="text-green-600 font-medium">+233 200 000 000</a></p>
          <p>💬 WhatsApp: <a href="https://wa.me/233200000000" className="text-green-600 font-medium">Chat with us</a></p>
          <p>📧 Email: <a href="mailto:vendors@campusbite.gh" className="text-green-600 font-medium">vendors@campusbite.gh</a></p>
        </div>
      </div>
    </div>
  );
}
