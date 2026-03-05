import React, { useState, useEffect } from 'react';
import api from '../api/client';

const CATEGORIES = ['Rice Dishes','Soups & Stews','Swallows','Proteins','Snacks','Drinks','Breakfast','Combos'];

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Rice Dishes' });

  const fetchMenu = async () => {
    try {
      const res = await api.get('/vendors/me/dashboard');
      const vendorRes = await api.get(`/vendors/${res.data.vendor.id}/menu`);
      const allItems = Object.values(vendorRes.data.menu).flat();
      setItems(allItems);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/menu', { ...form, price: parseFloat(form.price) });
      setForm({ name: '', description: '', price: '', category: 'Rice Dishes' });
      setShowForm(false);
      fetchMenu();
    } catch (err) { console.error(err); }
  };

  const toggleAvail = async (id, current) => {
    try { await api.patch(`/menu/${id}`, { isAvailable: !current }); fetchMenu(); }
    catch (err) { console.error(err); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/menu/${id}`); fetchMenu(); }
    catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Menu Management 🍽️</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-500 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">
          {showForm ? '✕ Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800">Add New Menu Item</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (GHS) *</label>
              <input type="number" step="0.50" className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-500" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-500" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-500" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <button type="submit" className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors">Add Item ✓</button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="text-4xl animate-bounce">🍱</div></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${item.isAvailable ? 'border-gray-100' : 'border-red-100 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400 bg-gray-100 inline-block px-2 py-0.5 rounded-full mt-1">{item.category}</p>
                  {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                  <p className="text-green-600 font-bold mt-2 text-lg">GHS {item.price?.toFixed(2)}</p>
                </div>
                <div className="text-3xl ml-3">🍱</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleAvail(item.id, item.isAvailable)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${item.isAvailable ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  {item.isAvailable ? '⛔ Disable' : '✅ Enable'}
                </button>
                <button onClick={() => deleteItem(item.id)} className="px-4 py-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 text-sm transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
