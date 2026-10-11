/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Navigation,
  RefreshCw,
  LayoutGrid,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Users,
  Compass,
  FileDown,
  Upload,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DrawerMenu } from './components/DrawerMenu';
import { StatsBreakdown } from './components/StatsBreakdown';
import { ConsumerCard } from './components/ConsumerCard';
import { UpdateConsumerModal } from './components/UpdateConsumerModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { BulkImportModal } from './components/BulkImportModal';
import { RankingView } from './components/RankingView';
import { AdminUserManager } from './components/AdminUserManager';
import { AdminConsumerEditor } from './components/AdminConsumerEditor';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { MeetingReportView } from './components/MeetingReportView';
import { HistoryLogsView } from './components/HistoryLogsView';
import { LoginView } from './components/LoginView';
import { Consumer } from './types';
import { translations, formatINR } from './utils/translations';

function MainApp() {
  const {
    currentUser,
    visibleConsumers,
    consumers,
    activeView,
    setActiveView,
    language,
    searchQuery,
    setSearchQuery,
    selectedAgencyFilter,
    setSelectedAgencyFilter,
    selectedClassFilter,
    setSelectedClassFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    minOsdFilter,
    setMinOsdFilter,
    nearbyRadiusActive,
    toggleNearbyLocator,
    toastMessage,
    reissueConsumer,
    theme,
  } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedConsumerForUpdate, setSelectedConsumerForUpdate] = useState<Consumer | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const t = translations[language];

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const getThemeBgClass = () => {
    switch (theme) {
      case 'night_shift':
        return 'bg-slate-950 text-slate-100';
      case 'emerald_pro':
        return 'bg-emerald-50/50 text-slate-900';
      case 'electric_blue':
        return 'bg-blue-50/30 text-slate-900';
      case 'official_white':
      default:
        return 'bg-[#F1F5F9] text-slate-900';
    }
  };

  const getLocateBtnClass = () => {
    if (nearbyRadiusActive) {
      return 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300';
    }
    switch (theme) {
      case 'emerald_pro':
        return 'bg-emerald-700 hover:bg-emerald-800 text-white';
      case 'night_shift':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'official_white':
      default:
        return 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-md shadow-blue-500/20';
    }
  };

  return (
    <div className={`min-h-screen transition-colors flex flex-col font-sans ${getThemeBgClass()}`}>
      {/* Top Navbar */}
      <Navbar onOpenDrawer={() => setIsDrawerOpen(true)} />

      {/* Slide-out Drawer Menu */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenExportPdf={() => setIsPdfExportOpen(true)}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeView === 'rankings' && <RankingView />}
        {activeView === 'admin_users' && <AdminUserManager />}
        {activeView === 'admin_consumers' && <AdminConsumerEditor />}
        {activeView === 'meeting_report' && <MeetingReportView />}
        {activeView === 'sheet_sync' && <GoogleSheetSyncModal />}
        {activeView === 'history_logs' && <HistoryLogsView />}
        {activeView === 'analytics' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            <div className="mb-3">
              <button
                onClick={() => setActiveView('consumers')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Consumer Hub</span>
              </button>
            </div>
            <StatsBreakdown forceOpen={true} />
          </div>
        )}

        {/* Default View: Consumers List & Survey Hub (Screenshots 1, 2, 5) */}
        {activeView === 'consumers' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            {/* 1. Dashboard Statistics Breakdown (Collapsible) */}
            <StatsBreakdown />

            {/* 2. Search & Filter Bar (Matching Screenshot 1 & 5) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 mb-3 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Trigger Button */}
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  aria-label="Toggle filters"
                  className={`p-2 sm:px-3 sm:py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isFiltersOpen ||
                    selectedAgencyFilter !== 'All' ||
                    selectedClassFilter !== 'All' ||
                    selectedStatusFilter !== 'All' ||
                    minOsdFilter > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {minOsdFilter > 0 ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-amber-200">
                      ≥ {minOsdFilter >= 1000 ? `${minOsdFilter / 1000}K` : minOsdFilter}
                    </span>
                  ) : (
                    (selectedAgencyFilter !== 'All' ||
                      selectedClassFilter !== 'All' ||
                      selectedStatusFilter !== 'All') && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )
                  )}
                </button>
              </div>

              {/* Quick Min OSD Marker Chip Row (1-Tap Selection) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 text-xs no-scrollbar">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 pr-0.5">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>OSD Mark:</span>
                </span>

                {[
                  { label: 'All Dues', val: 0, tag: 'All' },
                  { label: '≥ 3K', val: 3000, tag: '3K+' },
                  { label: '≥ 5K', val: 5000, tag: '5K+' },
                  { label: '≥ 10K', val: 10000, tag: '10K+' },
                  { label: '≥ 25K', val: 25000, tag: '25K+' },
                  { label: '≥ 50K', val: 5000, tag: '50K+' },
                ].map((preset) => {
                  const isActive = minOsdFilter === preset.val;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setMinOsdFilter(preset.val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? preset.val === 0
                            ? 'bg-slate-800 text-white shadow-xs'
                            : preset.val >= 10000
                            ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-300'
                            : preset.val >= 5000
                            ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                            : 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                {/* Custom Marker Chip if active with arbitrary number */}
                {minOsdFilter > 0 && ![3000, 5000, 10000, 25000, 50000].includes(minOsdFilter) && (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white shadow-xs shrink-0 flex items-center gap-1.5">
                    <span>≥ {formatINR(minOsdFilter)}</span>
                    <button
                      onClick={() => setMinOsdFilter(0)}
                      className="hover:opacity-75 font-black text-xs cursor-pointer"
                      title="Clear custom marker"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              {/* Expandable Agency, Class, Status & Min OSD Filter Strip */}
              {isFiltersOpen && (
                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs animate-in fade-in-50">
                  {/* Agency Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                      <span>Filter by Agency</span>
                      {selectedAgencyFilter !== 'All' && (
                        <button
                          onClick={() => setSelectedAgencyFilter('All')}
                          className="text-blue-600 hover:underline lowercase font-normal cursor-pointer"
                        >
                          reset
                        </button>
                      )}
                    </label>
                    <select
                      value={selectedAgencyFilter}
                      onChange={(e) => setSelectedAgencyFilter(e.target.value)}
                      disabled={currentUser.role === 'user' && currentUser.agency !== 'ALL'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-60"
                    >
                      <option value="All">All Agencies</option>
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
                  </div>

                  {/* Class Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Filter by Class
                    </label>
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="All">All Classes</option>
                      <option value="A">Class A</option>
                      <option value="B">Class B</option>
                      <option value="C">Class C</option>
                      <option value="D">Class D</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="All">All Statuses</option>
                      <option value="connected">Connected / Unattended</option>
                      <option value="disconnected">Disconnected</option>
                      <option value="paid">Paid</option>
                      <option value="dispute">Bill Dispute</option>
                      <option value="office_team">Office Team</option>
                      <option value="not_found">Not Found</option>
                    </select>
                  </div>

                  {/* Min OSD Marker Filter & Any Value Input */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        Min OSD Marker
                      </span>
                      {minOsdFilter > 0 && (
                        <button
                          onClick={() => setMinOsdFilter(0)}
                          className="text-blue-600 hover:underline lowercase font-normal cursor-pointer"
                        >
                          reset
                        </button>
                      )}
                    </label>
                    <select
                      value={[0, 3000, 5000, 10000, 25000, 50000].includes(minOsdFilter) ? minOsdFilter : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          setMinOsdFilter(Number(val));
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    >
                      <option value={0}>All Outstanding (₹0+)</option>
                      <option value={3000}>≥ ₹3,000 (3K and above)</option>
                      <option value={5000}>≥ ₹5,000 (5K and above)</option>
                      <option value={10000}>≥ ₹10,000 (10K and above)</option>
                      <option value={25000}>≥ ₹25,000 (25K and above)</option>
                      <option value={50000}>≥ ₹50,000 (50K and above)</option>
                      <option value="custom">Custom Any Marker (₹)</option>
                    </select>

                    {/* Numeric Any Values Marker Input */}
                    <div className="mt-1.5 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="Any min OSD value (e.g. 4000)"
                        value={minOsdFilter > 0 ? minOsdFilter : ''}
                        onChange={(e) => setMinOsdFilter(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full pl-6 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Locate Nearby Consumers (Big prominent button as in Screenshot 1 & 5) */}
            <div className="mb-3">
              <button
                onClick={toggleNearbyLocator}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${getLocateBtnClass()}`}
              >
                <Compass className={`w-5 h-5 ${nearbyRadiusActive ? 'animate-pulse' : ''}`} />
                <span>
                  {nearbyRadiusActive ? t.stopLocating : t.locateNearby}
                </span>
              </button>
            </div>

            {/* 4. Subheader: Consumer Count + Refresh */}
            <div className="flex items-center justify-between text-xs text-slate-600 mb-3 px-1 gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap font-semibold text-slate-700">
                <div>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {visibleConsumers.length}
                  </span>{' '}
                  {t.consumersCount}{' '}
                  {currentUser.role === 'user' && (
                    <span className="text-blue-600 font-mono">
                      (Agency {currentUser.agency} Assigned Only)
                    </span>
                  )}
                </div>

                {/* Active Min OSD Marker pill with 1-click clear */}
                {minOsdFilter > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
                    <Zap className="w-3 h-3 text-amber-600 fill-amber-600" />
                    <span>OSD ≥ {formatINR(minOsdFilter)}</span>
                    <button
                      onClick={() => setMinOsdFilter(0)}
                      className="hover:text-amber-950 font-black cursor-pointer text-xs leading-none"
                      title="Clear min OSD filter"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {/* Total Recoverable Outstanding in current filter */}
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  • Total: {formatINR(visibleConsumers.reduce((sum, c) => sum + (c.osd || 0), 0))}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setIsBulkImportOpen(true)}
                    title="Import, review, and edit bulk disconnection consumer list"
                    className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bulk Import / Edit</span>
                  </button>
                )}

                <button
                  onClick={() => setIsPdfExportOpen(true)}
                  title="Export current filtered view to printer-friendly PDF"
                  className="flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer text-xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1 hover:text-blue-600 font-medium px-2 py-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{t.refresh}</span>
                </button>
              </div>
            </div>

            {/* 5. Consumers Card Grid (Screenshots 1 & 5) */}
            {visibleConsumers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center text-slate-500">
                <p className="font-bold text-base text-slate-700">No Consumers Found</p>
                <p className="text-xs mt-1">
                  Try adjusting your search query, agency, or class filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {visibleConsumers.map((consumer) => (
                  <ConsumerCard
                    key={consumer.id}
                    consumer={consumer}
                    onUpdate={(c) => setSelectedConsumerForUpdate(c)}
                    onReissue={(id) => reissueConsumer(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Update Consumer Action Modal */}
      {selectedConsumerForUpdate && (
        <UpdateConsumerModal
          consumer={selectedConsumerForUpdate}
          onClose={() => setSelectedConsumerForUpdate(null)}
        />
      )}

      {/* Printable PDF Export Modal */}
      <ExportPdfModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        consumers={visibleConsumers}
      />

      {/* Bulk Disconnection Import & Editor Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* Floating Action / Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
