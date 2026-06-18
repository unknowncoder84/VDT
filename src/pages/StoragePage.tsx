import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Archive, Plus, Trash2, Search, MapPin, FolderOpen, X } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatIndianDate } from '../utils/dateFormat';

interface StorageLocation {
  id: string;
  name: string;
  description: string;
}

interface StorageItem {
  id: string;
  name: string;
  item_type: string;
  location: string;
  location_id: string | null;
  rack_no: string;
  notes: string;
  added_by_name: string;
  created_at: string;
}

const ITEM_TYPES = ['File', 'Folder', 'Box', 'Document', 'Envelope', 'Other'];

const typeColors: Record<string, string> = {
  File: 'bg-blue-500/10 text-blue-400',
  Folder: 'bg-yellow-500/10 text-yellow-400',
  Box: 'bg-orange-500/10 text-orange-400',
  Document: 'bg-green-500/10 text-green-400',
  Envelope: 'bg-purple-500/10 text-purple-400',
  Other: 'bg-gray-500/10 text-gray-400',
};

const StoragePage: React.FC = () => {
  const { theme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLoc, setFilterLoc] = useState<string>('all');

  // Add item modal
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [itemType, setItemType] = useState('File');
  const [locationId, setLocationId] = useState('');
  const [rackNo, setRackNo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Location mini-form
  const [showLocForm, setShowLocForm] = useState(false);
  const [locName, setLocName] = useState('');
  const [locDesc, setLocDesc] = useState('');
  const [savingLoc, setSavingLoc] = useState(false);

  const tenantId = user?.tenant_id;

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    const [{ data: locs }, { data: its }] = await Promise.all([
      supabase.from('storage_locations').select('*').eq('tenant_id', tenantId).order('name', { ascending: true }),
      supabase.from('storage_items').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ]);
    setLocations(locs || []);
    setItems(its || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tenantId]);

  const handleAddLocation = async () => {
    if (!locName.trim()) return;
    setSavingLoc(true);
    const { data, error } = await supabase.from('storage_locations').insert([{
      tenant_id: tenantId,
      name: locName.trim(),
      description: locDesc.trim(),
      created_by: user?.id,
    }]).select().single();
    setSavingLoc(false);
    if (!error && data) {
      setLocations(prev => [...prev, data]);
      setLocName(''); setLocDesc(''); setShowLocForm(false);
    }
  };

  const handleDeleteLocation = async (loc: StorageLocation) => {
    const inUse = items.some(i => i.location_id === loc.id);
    if (inUse) { alert(`Cannot delete "${loc.name}" — items are stored there. Reassign them first.`); return; }
    await supabase.from('storage_locations').delete().eq('id', loc.id);
    setLocations(prev => prev.filter(l => l.id !== loc.id));
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const loc = locations.find(l => l.id === locationId);
    const { data, error } = await supabase.from('storage_items').insert([{
      tenant_id: tenantId,
      name: name.trim(),
      item_type: itemType,
      location: loc?.name || '',
      location_id: locationId || null,
      rack_no: rackNo.trim(),
      notes: notes.trim(),
      added_by: user?.id,
      added_by_name: user?.name,
    }]).select().single();
    setSaving(false);
    if (!error && data) {
      setItems(prev => [data, ...prev]);
      setName(''); setItemType('File'); setLocationId(''); setRackNo(''); setNotes('');
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('storage_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const filtered = items.filter(i => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.rack_no || '').toLowerCase().includes(search.toLowerCase());
    const matchLoc =
      filterLoc === 'all' ? true :
      filterLoc === 'unassigned' ? !i.location_id :
      i.location_id === filterLoc;
    return matchSearch && matchLoc;
  });

  const card = theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'glass-dark border-white/10';
  const h = theme === 'light' ? 'text-gray-900' : 'text-white';
  const sub = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const inp = theme === 'light'
    ? 'w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500'
    : 'w-full px-4 py-3 bg-[#2a2a3e] border border-orange-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-orange-500';
  const chip = theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-white/5 text-gray-300 border-white/10';

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-2xl font-bold ${h}`}>Storage</h1>
            <p className={`text-sm ${sub}`}>Track physical files, folders and boxes by location</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm">
            <Plus size={18} /> Add Item
          </button>
        </div>

        {/* LOCATION MANAGER */}
        <div className={`${card} rounded-2xl p-6 border`}>
          <h3 className={`font-semibold ${h} mb-1`}>Storage Locations</h3>
          <p className={`text-sm ${sub} mb-4`}>Create locations like S1, S2 to know exactly where each physical file or folder is kept</p>
          <div className="flex flex-wrap items-center gap-2">
            {locations.map(loc => (
              <div key={loc.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${chip}`} title={loc.description}>
                <MapPin size={13} className="text-orange-400" />
                {loc.name}
                {isAdmin && (
                  <button onClick={() => handleDeleteLocation(loc)} className="text-red-400 hover:text-red-500 ml-1"><X size={13} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setShowLocForm(!showLocForm)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-orange-500/40 text-orange-500 text-sm font-medium hover:bg-orange-500/10 transition-all">
              <Plus size={14} /> Add
            </button>
          </div>
          {showLocForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={locName} onChange={e => setLocName(e.target.value)} placeholder="S1, S2, Rack-A" className={inp} maxLength={20} />
              <input value={locDesc} onChange={e => setLocDesc(e.target.value)} placeholder="Description (optional)" className={inp} />
              <div className="flex gap-3 md:col-span-2">
                <button onClick={handleAddLocation} disabled={savingLoc || !locName.trim()}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2 rounded-xl font-medium text-sm disabled:opacity-50">
                  {savingLoc ? 'Saving...' : 'Save Location'}
                </button>
                <button onClick={() => { setShowLocForm(false); setLocName(''); setLocDesc(''); }} className={`${sub} text-sm hover:text-orange-500`}>Cancel</button>
              </div>
            </motion.div>
          )}
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterLoc('all')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${filterLoc === 'all' ? 'bg-orange-500 text-white border-orange-500' : chip}`}>All</button>
            {locations.map(loc => (
              <button key={loc.id} onClick={() => setFilterLoc(loc.id)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${filterLoc === loc.id ? 'bg-orange-500 text-white border-orange-500' : chip}`}>{loc.name}</button>
            ))}
            <button onClick={() => setFilterLoc('unassigned')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${filterLoc === 'unassigned' ? 'bg-orange-500 text-white border-orange-500' : chip}`}>Unassigned</button>
          </div>
          <div className="relative flex-1 min-w-48">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${sub}`} size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className={`${inp} pl-11`} />
          </div>
        </div>

        {/* ITEMS */}
        {loading ? (
          <div className="text-center py-12"><div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className={`${card} rounded-2xl p-12 border text-center`}>
            <Archive size={48} className={`${sub} mx-auto mb-4`} />
            <p className={`${h} font-medium mb-1`}>No items yet</p>
            <p className={`${sub} text-sm`}>Add files, folders and boxes to track their physical location</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`${card} rounded-2xl p-5 border flex items-start justify-between gap-4`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen size={16} className="text-orange-500 shrink-0" />
                    <h4 className={`font-semibold ${h} text-sm truncate`}>{item.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColors[item.item_type] || typeColors.Other}`}>
                      {item.item_type}
                    </span>
                  </div>
                  {item.location_id ? (
                    <span className="inline-flex items-center gap-1 text-orange-400 text-xs font-medium bg-orange-500/10 px-2 py-0.5 rounded-full">
                      <MapPin size={11} /> {item.location}{item.rack_no ? ` · ${item.rack_no}` : ''}
                    </span>
                  ) : (
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-gray-400'}`}>Unassigned{item.rack_no ? ` · ${item.rack_no}` : ''}</span>
                  )}
                  {item.notes && <p className={`text-xs ${sub} mt-1`}>{item.notes}</p>}
                  <p className={`text-xs ${sub} mt-2`}>Added by {item.added_by_name} · {formatIndianDate(item.created_at)}</p>
                </div>
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all shrink-0">
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD ITEM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`${card} rounded-2xl p-6 border max-w-lg w-full`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-semibold ${h}`}>Add Storage Item</h3>
              <button onClick={() => setShowForm(false)} className={`${sub} hover:text-orange-500`}><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${sub} mb-1`}>Item Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sharma Case File 2024, Box A" className={inp} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${sub} mb-1`}>Item Type</label>
                <select value={itemType} onChange={e => setItemType(e.target.value)} className={inp}>
                  {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${sub} mb-1`}>Location</label>
                <select value={locationId} onChange={e => setLocationId(e.target.value)} className={inp}>
                  <option value="">Unassigned</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${sub} mb-1`}>Rack/Section No.</label>
                <input value={rackNo} onChange={e => setRackNo(e.target.value)} placeholder="e.g. Rack A-3, Shelf 2" className={inp} />
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium ${sub} mb-1`}>Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details" className={inp} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleAdd} disabled={saving || !name.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Item'}
              </button>
              <button onClick={() => setShowForm(false)} className={`${sub} text-sm hover:text-orange-500 transition-colors`}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
};

export default StoragePage;
