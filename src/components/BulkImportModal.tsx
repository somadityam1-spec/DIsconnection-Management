import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  Download,
  Filter,
  Check,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Consumer, ConsumerStatus, PriorityLevel } from '../types';
import { parseCSVToConsumers, exportConsumersToCSV } from '../utils/sheetSync';
import { formatINR } from '../utils/translations';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const { consumers, importBulkConsumers, showToast } = useApp();

  const [importMode, setImportMode] = useState<'upsert' | 'replace' | 'append'>('upsert');
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  const [pastedCSV, setPastedCSV] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  // Staged consumers parsed from CSV / text
  const [stagedConsumers, setStagedConsumers] = useState<Consumer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<Partial<Consumer>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process text or file content
  const handleParseContent = (csvText: string, name?: string) => {
    if (!csvText.trim()) {
      showToast('Empty data. Please select a CSV file or paste text.');
      return;
    }

    try {
      const parsed = parseCSVToConsumers(csvText);
      if (parsed.length === 0) {
        showToast('No valid consumer records identified. Please verify headers.');
        return;
      }
      setStagedConsumers(parsed);
      if (name) setFileName(name);
      setActiveTab('preview');
      showToast(`Parsed ${parsed.length} consumers ready for review & editing.`);
    } catch (err: any) {
      showToast(`Parse error: ${err.message || 'Invalid format'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleParseContent(text, file.name);
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-uploaded if desired
    e.target.value = '';
  };

  const handleDownloadSample = () => {
    const sampleCSV = `Consumer ID,Name,Address,Class,OSD,MRU,Mobile No,Lat,Long,Meter No,Agency,Issued Date,Status,Priority
342099001,ANISUR RAHMAN,VILL-BHABANIPUR HARISHCHANDRAPUR,A,38500,9QS66MMR,9832011223,25.4328,87.8921,XB009101,AC,07.03.2025,connected,urgent
342099002,SUBODH CHANDRA DAS,VILL-BANGRUA MALDA,B,24200,9QS66MMR,9733441122,25.4410,87.8850,XB009102,CM,07.03.2025,connected,normal
342099003,MD RAFIQUL ISLAM,VILL-KUSHALPUR HARISHCHANDRAPUR,A,51200,9QS67MMR,9475112233,25.4280,87.8990,XB009103,MR,07.03.2025,connected,urgent
342099004,BIJOY KRISHNA SAHA,VILL-PIPLA HARISHCHANDRAPUR,Commercial,68000,9QS68MMR,9609808971,25.4350,87.9010,XB009104,JG,07.03.2025,connected,urgent
342099005,MOMIN KHAN,VILL-DAULATPUR MALDA,C,12900,9QS69MMR,9434005544,25.4190,87.8800,XB009105,MZ,07.03.2025,connected,normal`;

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WBSEDCL_Bulk_Disconnection_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded sample CSV template');
  };

  // Row inline edit handlers
  const startEditing = (consumer: Consumer) => {
    setEditingId(consumer.id);
    setEditingRow({ ...consumer });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingRow({});
  };

  const saveEditing = (id: string) => {
    setStagedConsumers((prev) =>
      prev.map((c) => (c.id === id ? ({ ...c, ...editingRow } as Consumer) : c))
    );
    setEditingId(null);
    setEditingRow({});
    showToast(`Updated staged consumer #${id}`);
  };

  const deleteStagedRow = (id: string) => {
    setStagedConsumers((prev) => prev.filter((c) => c.id !== id));
    showToast(`Removed consumer #${id} from import`);
  };

  // Bulk actions on staged list
  const applyBulkAgency = (targetAgency: string) => {
    if (!targetAgency || targetAgency === 'All') return;
    setStagedConsumers((prev) =>
      prev.map((c) => ({ ...c, agency: targetAgency.toUpperCase() }))
    );
    showToast(`Assigned all staged consumers to Agency ${targetAgency.toUpperCase()}`);
  };

  const applyBulkPriority = (targetPriority: PriorityLevel) => {
    setStagedConsumers((prev) =>
      prev.map((c) => ({ ...c, priority: targetPriority }))
    );
    showToast(`Set priority to ${targetPriority.toUpperCase()} for all`);
  };

  // Final confirmation: Commit to master state in AppContext
  const handleCommitImport = () => {
    if (stagedConsumers.length === 0) {
      showToast('No consumers staged to import.');
      return;
    }

    const count = importBulkConsumers(stagedConsumers, importMode);
    onClose();
  };

  // Filtered view in preview table
  const distinctAgencies = useMemo(() => {
    const set = new Set<string>();
    stagedConsumers.forEach((c) => {
      if (c.agency) set.add(c.agency.toUpperCase());
    });
    return ['All', ...Array.from(set).sort()];
  }, [stagedConsumers]);

  const filteredStaged = stagedConsumers.filter((c) => {
    if (agencyFilter !== 'All' && c.agency.toUpperCase() !== agencyFilter.toUpperCase()) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mru.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.mobileNo.includes(q) ||
        c.agency.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalOsdStaged = stagedConsumers.reduce((sum, c) => sum + (c.osd || 0), 0);

  // Check how many clash with existing database
  const existingIdSet = useMemo(() => new Set(consumers.map((c) => c.id)), [consumers]);
  const existingMatches = stagedConsumers.filter((c) => existingIdSet.has(c.id)).length;
  const newAdditions = stagedConsumers.length - existingMatches;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in-50 zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <FileSpreadsheet className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Bulk Disconnection Import & Editor
                </h2>
                <span className="bg-blue-500/30 text-blue-100 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  CSV / Excel Parser
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Import consumer lists in bulk, preview, modify individual columns before saving into active DC registry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>1. Upload / Paste Data</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-t-xl border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>
                2. Review & Edit Staged List{' '}
                {stagedConsumers.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 font-mono text-xs px-2 py-0.5 rounded-full ml-1">
                    {stagedConsumers.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer mb-1"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Download Sample CSV</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'upload' ? (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Drag & Drop File Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="w-14 h-14 bg-blue-600 group-hover:scale-105 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  Choose a CSV File or Click to Browse
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Supports standard DC files with Consumer ID, Name, OSD, MRU, Mobile, Class, and Agency columns.
                </p>
                {fileName && (
                  <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                    <FileText className="w-4 h-4" />
                    <span>Loaded: {fileName}</span>
                  </div>
                )}
              </div>

              {/* Paste CSV Directly */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Or Paste CSV / Tab-Separated Records</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPastedCSV(
                        `342099111,ABDUL KALAM,VILL-SITALPUR HARISHCHANDRAPUR,A,42000,9QS66MMR,9832112233,25.4328,87.8921,XB009211,AC,07.03.2025,connected,urgent\n342099112,PRODYUT SARKAR,VILL-CHANDIPUR MALDA,B,18500,9QS67MMR,9475223344,25.4410,87.8850,XB009212,CM,07.03.2025,connected,normal`
                      );
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Paste Demo Rows
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={pastedCSV}
                  onChange={(e) => setPastedCSV(e.target.value)}
                  placeholder="Consumer ID, Name, Address, Class, OSD, MRU, Mobile No, Lat, Long, Meter No, Agency&#10;342099001,Anisur Rahman,Harishchandrapur,A,38500,9QS66MMR,9832011223,25.4328,87.8921,XB009101,AC"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleParseContent(pastedCSV, 'Pasted-Text.csv')}
                    disabled={!pastedCSV.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Parse & Review Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Supported Columns Guide */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Column Auto-Mapping Intelligence</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Headers are flexibly detected. Column names like <strong>Consumer ID</strong>, <strong>Name</strong>, <strong>OSD / Outstanding</strong>, <strong>Class</strong>, <strong>MRU</strong>, <strong>Agency</strong>, <strong>Mobile</strong>, <strong>Meter</strong> are automatically recognized. Missing values are filled with standard Harishchandrapur CCC defaults.
                </p>
              </div>
            </div>
          ) : (
            /* Review & Edit Staged List */
            <div className="space-y-4">
              {/* Summary Stats & Bulk Modifiers Bar */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-slate-500 font-medium">Staged Records:</span>{' '}
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      {stagedConsumers.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Total OSD:</span>{' '}
                    <span className="font-bold font-mono text-rose-600 text-sm">
                      {formatINR(totalOsdStaged)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">New vs Existing:</span>{' '}
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      +{newAdditions} New
                    </span>{' '}
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                      {existingMatches} Updates
                    </span>
                  </div>
                </div>

                {/* Batch Overwrite Tools */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">
                    Batch Set:
                  </span>
                  <select
                    onChange={(e) => applyBulkAgency(e.target.value)}
                    defaultValue=""
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value="" disabled>Assign Agency...</option>
                    <option value="AC">Agency AC</option>
                    <option value="CM">Agency CM</option>
                    <option value="MR">Agency MR</option>
                    <option value="JG">Agency JG</option>
                    <option value="MZ">Agency MZ</option>
                    <option value="SA">Agency SA</option>
                    <option value="RK">Agency RK</option>
                    <option value="HB">Agency HB</option>
                    <option value="ER">Agency ER</option>
                  </select>

                  <select
                    onChange={(e) => applyBulkPriority(e.target.value as PriorityLevel)}
                    defaultValue=""
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value="" disabled>Set Priority...</option>
                    <option value="urgent">Urgent Priority</option>
                    <option value="normal">Normal Priority</option>
                  </select>
                </div>
              </div>

              {/* Search & Agency Filter */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in staged records by ID, name, agency, MRU..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={agencyFilter}
                    onChange={(e) => setAgencyFilter(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    {distinctAgencies.map((ag) => (
                      <option key={ag} value={ag}>
                        {ag === 'All' ? 'All Staged Agencies' : `Agency ${ag}`}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      if (confirm('Clear all staged rows?')) {
                        setStagedConsumers([]);
                        setActiveTab('upload');
                      }
                    }}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Editable Staged Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[48vh]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3"># ID</th>
                        <th className="py-2.5 px-3">Consumer Name</th>
                        <th className="py-2.5 px-2 text-right">OSD (₹)</th>
                        <th className="py-2.5 px-2">Agency</th>
                        <th className="py-2.5 px-2">Class</th>
                        <th className="py-2.5 px-2">MRU</th>
                        <th className="py-2.5 px-2">Meter No</th>
                        <th className="py-2.5 px-2">Mobile</th>
                        <th className="py-2.5 px-2">Priority</th>
                        <th className="py-2.5 px-3 text-right">Edit / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {filteredStaged.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                            No staged consumer records match your filter.
                          </td>
                        </tr>
                      ) : (
                        filteredStaged.map((c) => {
                          const isRowEditing = editingId === c.id;
                          const isExisting = existingIdSet.has(c.id);

                          return (
                            <tr
                              key={c.id}
                              className={`hover:bg-blue-50/50 transition-colors ${
                                isExisting ? 'bg-amber-50/20' : ''
                              }`}
                            >
                              {/* ID */}
                              <td className="py-2 px-3 font-bold text-blue-700 flex items-center gap-1.5">
                                <span>{c.id}</span>
                                {isExisting && (
                                  <span
                                    title="Consumer already exists in system; will be merged"
                                    className="bg-amber-100 text-amber-800 text-[9px] font-sans px-1 rounded font-bold"
                                  >
                                    UPDATE
                                  </span>
                                )}
                              </td>

                              {/* Name */}
                              <td className="py-2 px-3 font-sans font-semibold text-slate-900 max-w-[180px] truncate">
                                {isRowEditing ? (
                                  <input
                                    type="text"
                                    value={editingRow.name ?? c.name}
                                    onChange={(e) =>
                                      setEditingRow({ ...editingRow, name: e.target.value })
                                    }
                                    className="border border-blue-400 rounded px-1.5 py-0.5 text-xs w-full bg-white font-sans"
                                  />
                                ) : (
                                  c.name
                                )}
                              </td>

                              {/* OSD */}
                              <td className="py-2 px-2 text-right font-bold text-rose-600 tabular-nums">
                                {isRowEditing ? (
                                  <input
                                    type="number"
                                    value={editingRow.osd ?? c.osd}
                                    onChange={(e) =>
                                      setEditingRow({
                                        ...editingRow,
                                        osd: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs w-20 text-right bg-white"
                                  />
                                ) : (
                                  formatINR(c.osd)
                                )}
                              </td>

                              {/* Agency */}
                              <td className="py-2 px-2 font-sans">
                                {isRowEditing ? (
                                  <select
                                    value={editingRow.agency ?? c.agency}
                                    onChange={(e) =>
                                      setEditingRow({
                                        ...editingRow,
                                        agency: e.target.value.toUpperCase(),
                                      })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs bg-white font-bold"
                                  >
                                    <option value="AC">AC</option>
                                    <option value="CM">CM</option>
                                    <option value="MR">MR</option>
                                    <option value="JG">JG</option>
                                    <option value="MZ">MZ</option>
                                    <option value="SA">SA</option>
                                    <option value="RK">RK</option>
                                    <option value="HB">HB</option>
                                    <option value="ER">ER</option>
                                  </select>
                                ) : (
                                  <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                                    {c.agency}
                                  </span>
                                )}
                              </td>

                              {/* Class */}
                              <td className="py-2 px-2 font-sans font-bold">
                                {isRowEditing ? (
                                  <select
                                    value={editingRow.class ?? c.class}
                                    onChange={(e) =>
                                      setEditingRow({ ...editingRow, class: e.target.value })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs bg-white"
                                  >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="Commercial">Commercial</option>
                                  </select>
                                ) : (
                                  c.class
                                )}
                              </td>

                              {/* MRU */}
                              <td className="py-2 px-2 text-slate-600">
                                {isRowEditing ? (
                                  <input
                                    type="text"
                                    value={editingRow.mru ?? c.mru}
                                    onChange={(e) =>
                                      setEditingRow({ ...editingRow, mru: e.target.value })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs w-20 bg-white"
                                  />
                                ) : (
                                  c.mru
                                )}
                              </td>

                              {/* Meter No */}
                              <td className="py-2 px-2 text-slate-600">
                                {isRowEditing ? (
                                  <input
                                    type="text"
                                    value={editingRow.meterNo ?? c.meterNo}
                                    onChange={(e) =>
                                      setEditingRow({ ...editingRow, meterNo: e.target.value })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs w-20 bg-white"
                                  />
                                ) : (
                                  c.meterNo
                                )}
                              </td>

                              {/* Mobile */}
                              <td className="py-2 px-2 text-slate-600">
                                {isRowEditing ? (
                                  <input
                                    type="text"
                                    value={editingRow.mobileNo ?? c.mobileNo}
                                    onChange={(e) =>
                                      setEditingRow({ ...editingRow, mobileNo: e.target.value })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs w-24 bg-white"
                                  />
                                ) : (
                                  c.mobileNo
                                )}
                              </td>

                              {/* Priority */}
                              <td className="py-2 px-2 font-sans">
                                {isRowEditing ? (
                                  <select
                                    value={editingRow.priority ?? c.priority}
                                    onChange={(e) =>
                                      setEditingRow({
                                        ...editingRow,
                                        priority: e.target.value as PriorityLevel,
                                      })
                                    }
                                    className="border border-blue-400 rounded px-1 py-0.5 text-xs bg-white"
                                  >
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgent</option>
                                  </select>
                                ) : (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      c.priority === 'urgent'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {c.priority}
                                  </span>
                                )}
                              </td>

                              {/* Row Actions */}
                              <td className="py-2 px-3 text-right">
                                {isRowEditing ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => saveEditing(c.id)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                      title="Save row"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => startEditing(c)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                      title="Edit staged row"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteStagedRow(c.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                      title="Remove from import"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Import Strategy & Commit Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Import Mode:
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="upsert"
                  checked={importMode === 'upsert'}
                  onChange={() => setImportMode('upsert')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-700">Merge & Upsert (Recommended)</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer ml-2">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-600">Append Only</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer ml-2">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-red-600 font-semibold">Replace All Master Data</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'upload' ? (
              <button
                onClick={() => {
                  if (stagedConsumers.length > 0) {
                    setActiveTab('preview');
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCommitImport}
                disabled={stagedConsumers.length === 0}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Commit {stagedConsumers.length} Consumers to Registry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
