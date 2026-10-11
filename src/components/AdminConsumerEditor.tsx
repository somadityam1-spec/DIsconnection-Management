import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Search,
  ArrowLeft,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';
import { Consumer } from '../types';
import { exportConsumersToCSV, exportConsumersToExcel, parseCSVToConsumers } from '../utils/sheetSync';
import { BulkImportModal } from './BulkImportModal';

export const AdminConsumerEditor: React.FC = () => {
  const {
    consumers,
    currentUser,
    addConsumer,
    editConsumer,
    deleteConsumer,
    reissueConsumer,
    language,
    setActiveView,
    showToast,
  } = useApp();

  const t = translations[language];

  const [search, setSearch] = useState('');
  const [filterAgency, setFilterAgency] = useState('All');
  const [filterMinOsd, setFilterMinOsd] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // New Consumer Form
  const [form, setForm] = useState<Partial<Consumer>>({
    id: '',
    name: '',
    address: 'VILL-BHABANIPUR, HARISHCHANDRAPUR, MALDA',
    class: 'A',
    osd: 25000,
    mru: '9QS66MMR',
    mobileNo: '9832001122',
    lat: 25.4328,
    long: 87.8921,
    meterNo: 'XB008899',
    agency: 'AC',
    issuedDate: new Date().toLocaleDateString('en-GB'),
    status: 'connected',
    priority: 'normal',
  });

  const agencies = ['All', 'AC', 'CM', 'MR', 'JG', 'MZ', 'SA', 'RK', 'HB', 'ER'];

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold text-red-600">Admin Only Access</h2>
        <p className="text-sm text-slate-600 mt-2">
          Only the administrator can create, edit, or delete master consumer records.
        </p>
        <button
          onClick={() => setActiveView('consumers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id?.trim() || !form.name?.trim()) {
      showToast('Consumer ID and Name are required');
      return;
    }

    if (consumers.some((c) => c.id === form.id?.trim())) {
      showToast('A consumer with this ID already exists!');
      return;
    }

    const newConsumer: Consumer = {
      id: form.id.trim(),
      name: form.name.trim(),
      address: form.address || '',
      class: form.class || 'A',
      osd: Number(form.osd) || 0,
      mru: form.mru || '9QS66MMR',
      mobileNo: form.mobileNo || '',
      lat: Number(form.lat) || 25.4328,
      long: Number(form.long) || 87.8921,
      meterNo: form.meterNo || 'XB001000',
      agency: (form.agency || 'AC').toUpperCase(),
      issuedDate: form.issuedDate || new Date().toLocaleDateString('en-GB'),
      dueDate: `${form.issuedDate || '01.03.2025'}-10.08.2026`,
      status: 'connected',
      priority: form.priority || 'normal',
    };

    addConsumer(newConsumer);
    setIsCreating(false);
    setForm({
      id: '',
      name: '',
      address: '',
      class: 'A',
      osd: 25000,
      mru: '9QS66MMR',
      mobileNo: '',
      lat: 25.4328,
      long: 87.8921,
      meterNo: '',
      agency: 'AC',
      issuedDate: new Date().toLocaleDateString('en-GB'),
      status: 'connected',
      priority: 'normal',
    });
  };

  const filteredConsumers = consumers.filter((c) => {
    if (filterAgency !== 'All' && c.agency.toUpperCase() !== filterAgency.toUpperCase()) {
      return false;
    }
    if (filterMinOsd > 0 && (Number(c.osd) || 0) < filterMinOsd) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mru.toLowerCase().includes(q) ||
        c.mobileNo.includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('consumers')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.editDcList}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Admin Master Consumer Database: Add, modify, delete, and reissue survey records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportConsumersToExcel(consumers)}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import / Edit</span>
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Consumer</span>
          </button>
        </div>
      </div>

      {/* Add Consumer Form Box */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-blue-500 shadow-md space-y-4 animate-in fade-in-50"
        >
          <h3 className="font-extrabold text-base text-slate-900">
            Add New Disconnection Consumer Record
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Consumer ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 342099999"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Consumer Name *
              </label>
              <input
                type="text"
                required
                placeholder="Full consumer name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                OSD (₹ Outstanding) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Amount due"
                value={form.osd}
                onChange={(e) => setForm({ ...form, osd: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-rose-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Class *
              </label>
              <select
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
              >
                <option value="A">Class A</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
                <option value="D">Class D</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                MRU Section *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9QS66MMR"
                value={form.mru}
                onChange={(e) => setForm({ ...form, mru: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. 7602731349"
                value={form.mobileNo}
                onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Meter Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. XB001441"
                value={form.meterNo}
                onChange={(e) => setForm({ ...form, meterNo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Agency Code *
              </label>
              <select
                value={form.agency}
                onChange={(e) => setForm({ ...form, agency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold"
              >
                {agencies.filter((a) => a !== 'All').map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Latitude (GPS)
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Longitude (GPS)
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.long}
                onChange={(e) => setForm({ ...form, long: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Issued Date
              </label>
              <input
                type="text"
                value={form.issuedDate}
                onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 uppercase mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase mb-1 text-xs">
              Consumer Address *
            </label>
            <input
              type="text"
              required
              placeholder="Village, Post Office, Police Station, District"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Save Consumer to DC List
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, MRU, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Agency Filter */}
          <select
            value={filterAgency}
            onChange={(e) => setFilterAgency(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700"
          >
            {agencies.map((ag) => (
              <option key={ag} value={ag}>
                {ag === 'All' ? 'All Agencies' : `Agency ${ag}`}
              </option>
            ))}
          </select>

          {/* Min OSD Marker Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <select
              value={[0, 3000, 5000, 10000, 25000, 50000].includes(filterMinOsd) ? filterMinOsd : 'custom'}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== 'custom') {
                  setFilterMinOsd(Number(val));
                }
              }}
              className="text-xs sm:text-sm font-semibold text-slate-700 bg-transparent focus:outline-none"
            >
              <option value={0}>All Dues (₹0+)</option>
              <option value={3000}>≥ ₹3K (3,000+)</option>
              <option value={5000}>≥ ₹5K (5,000+)</option>
              <option value={10000}>≥ ₹10K (10,000+)</option>
              <option value={25000}>≥ ₹25K (25,000+)</option>
              <option value={50000}>≥ ₹50K (50,000+)</option>
              <option value="custom">Custom Any Marker</option>
            </select>

            {/* Custom input */}
            <div className="relative w-24">
              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="Min OSD"
                value={filterMinOsd > 0 ? filterMinOsd : ''}
                onChange={(e) => setFilterMinOsd(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-4 pr-1 py-1 text-xs border border-slate-200 rounded font-mono font-bold"
              />
            </div>

            {filterMinOsd > 0 && (
              <button
                onClick={() => setFilterMinOsd(0)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
                title="Reset Min OSD"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Consumers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Total Records: {filteredConsumers.length}
          </span>
          <span className="text-slate-500">
            Admin can edit, delete, or reissue any survey record
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3">Consumer ID</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-2 text-right">OSD (₹)</th>
                <th className="py-3 px-2">Agency</th>
                <th className="py-3 px-2">Class</th>
                <th className="py-3 px-2">MRU</th>
                <th className="py-3 px-2">Meter No</th>
                <th className="py-3 px-2">Mobile</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredConsumers.map((c) => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-blue-700">
                      {c.id}
                    </td>

                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900 max-w-[180px] truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={c.name}
                          id={`edit-c-name-${c.id}`}
                          className="border border-slate-300 rounded px-1.5 py-0.5 text-xs w-full"
                        />
                      ) : (
                        c.name
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-right font-bold text-rose-600 tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          defaultValue={c.osd}
                          id={`edit-c-osd-${c.id}`}
                          className="border border-slate-300 rounded px-1 py-0.5 text-xs w-20 text-right"
                        />
                      ) : (
                        <div>
                          <div>{formatINR(c.osd)}</div>
                          {c.osd >= 10000 ? (
                            <span className="inline-block text-[9px] font-black uppercase px-1 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              ≥ 10K
                            </span>
                          ) : c.osd >= 5000 ? (
                            <span className="inline-block text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-200">
                              ≥ 5K
                            </span>
                          ) : c.osd >= 3000 ? (
                            <span className="inline-block text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                              ≥ 3K
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-2">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={c.agency}
                          id={`edit-c-agency-${c.id}`}
                          className="border border-slate-300 rounded px-1 py-0.5 text-xs w-12 uppercase"
                        />
                      ) : (
                        <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                          {c.agency}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 font-sans font-bold">{c.class}</td>
                    <td className="py-2.5 px-2 text-slate-600">{c.mru}</td>
                    <td className="py-2.5 px-2 text-slate-600">{c.meterNo}</td>
                    <td className="py-2.5 px-2 text-slate-600">{c.mobileNo}</td>

                    <td className="py-2.5 px-2 font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'disconnected'
                            ? 'bg-red-100 text-red-800'
                            : c.status === 'dispute'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              const nameIn = document.getElementById(
                                `edit-c-name-${c.id}`
                              ) as HTMLInputElement;
                              const osdIn = document.getElementById(
                                `edit-c-osd-${c.id}`
                              ) as HTMLInputElement;
                              const agIn = document.getElementById(
                                `edit-c-agency-${c.id}`
                              ) as HTMLInputElement;

                              editConsumer({
                                ...c,
                                name: nameIn?.value || c.name,
                                osd: parseFloat(osdIn?.value) || c.osd,
                                agency: agIn?.value?.toUpperCase() || c.agency,
                              });
                              setEditingId(null);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => reissueConsumer(c.id)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                            title="Reissue Survey for Field Visit"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(c.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete consumer #${c.id} (${c.name})?`)) {
                                deleteConsumer(c.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Disconnection Import & Editor Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
