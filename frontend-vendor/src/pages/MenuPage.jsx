// src/pages/MenuPage.jsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { getVendorMenu, addMenuItem, updateMenuItem, toggleMenuItem, deleteMenuItem } from '../api/client';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['Rice Dishes', 'Soups', 'Swallows', 'Proteins', 'Snacks', 'Drinks', 'Breakfast'];

function ItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category: item?.category || 'Rice Dishes',
    preparationTime: item?.preparationTime || 15,
    imageUrl: item?.imageUrl || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...form, price: parseFloat(form.price) });
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold">{item ? 'Edit Item' : 'Add Menu Item'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Jollof Rice + Chicken" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Describe this dish..." rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (GHS) *</label>
              <input
                type="number" step="0.50" min="1" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="25.00" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (mins)</label>
              <input
                type="number" value={form.preparationTime}
                onChange={e => setForm({ ...form, preparationTime: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
            <input
              value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { vendor } = useAuthStore();
  const queryClient = useQueryClient();
  const [modalItem, setModalItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-menu', vendor?.id],
    queryFn: () => getVendorMenu(vendor.id).then(r => r.data),
    enabled: !!vendor?.id,
  });

  const allItems = data?.items || [];
  const filteredItems = activeCategory === 'All' ? allItems : allItems.filter(i => i.category === activeCategory);
  const usedCategories = ['All', ...new Set(allItems.map(i => i.category))];

  const handleSave = async (formData) => {
    if (modalItem?.id) {
      await updateMenuItem(modalItem.id, formData);
    } else {
      await addMenuItem(formData);
    }
    queryClient.invalidateQueries(['vendor-menu']);
  };

  const handleToggle = async (id) => {
    await toggleMenuItem(id);
    queryClient.invalidateQueries(['vendor-menu']);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item from your menu?')) return;
    await deleteMenuItem(id);
    queryClient.invalidateQueries(['vendor-menu']);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-1">{allItems.length} items</p>
        </div>
        <button onClick={() => { setModalItem(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {usedCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading menu...</div>
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🍽️</div>
          <div className="font-medium text-gray-700">No items yet</div>
          <div className="text-gray-400 text-sm mt-1">Add your first menu item to get started</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div key={item.id} className={`card relative ${!item.isAvailable ? 'opacity-60' : ''}`}>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded-xl mb-4" />
              )}
              {!item.imageUrl && (
                <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-yellow-50 rounded-xl mb-4 flex items-center justify-center text-4xl">
                  🍛
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.category} • {item.preparationTime} min</div>
                  {item.description && (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                  )}
                </div>
                <div className="font-bold text-green-600 ml-3 whitespace-nowrap">GHS {item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => handleToggle(item.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all">
                  {item.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                  {item.isAvailable ? 'Available' : 'Hidden'}
                </button>
                <button onClick={() => { setModalItem(item); setShowModal(true); }} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 border border-red-100 rounded-xl hover:bg-red-50 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ItemModal
          item={modalItem}
          onClose={() => { setShowModal(false); setModalItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
