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
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DrawerMenu } from './components/DrawerMenu';
import { StatsBreakdown } from './components/StatsBreakdown';
import { ConsumerCard } from './components/ConsumerCard';
import { UpdateConsumerModal } from './components/UpdateConsumerModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { RankingView } from './components/RankingView';
import { AdminUserManager } from './components/AdminUserManager';
import { AdminConsumerEditor } from './components/AdminConsumerEditor';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { MeetingReportView } from './components/MeetingReportView';
import { HistoryLogsView } from './components/HistoryLogsView';
import { LoginView } from './components/LoginView';
import { Consumer } from './types';
import { translations } from './utils/translations';

function MainApp() {
  const {
    currentUser,
    visibleConsumers,
    consumers,
    activeView,
    language,
    searchQuery,
    setSearchQuery,
    selectedClassFilter,
    setSelectedClassFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
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
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeView === 'rankings' && <RankingView />}
        {activeView === 'admin_users' && <AdminUserManager />}
        {activeView === 'admin_consumers' && <AdminConsumerEditor />}
        {activeView === 'meeting_report' && <MeetingReportView />}
        {activeView === 'sheet_sync' && <GoogleSheetSyncModal />}
        {activeView === 'history_logs' && <HistoryLogsView />}

        {/* Default View: Consumers List & Survey Hub (Screenshots 1, 2, 5) */}
        {activeView === 'consumers' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
            {/* 1. Dashboard Statistics Breakdown (Collapsible) */}
            <StatsBreakdown />

            {/* 2. Search & Filter Bar (Matching Screenshot 1 & 5) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 mb-3 shadow-2xs space-y-2">
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
                    isFiltersOpen || selectedClassFilter !== 'All' || selectedStatusFilter !== 'All'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </div>

              {/* Expandable Class and Status Filter Strip */}
              {isFiltersOpen && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs animate-in fade-in-50">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Filter by Class
                    </label>
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="All">All Classes</option>
                      <option value="A">Class A</option>
                      <option value="B">Class B</option>
                      <option value="C">Class C</option>
                      <option value="D">Class D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
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
            <div className="flex items-center justify-between text-xs text-slate-600 mb-3 px-1">
              <div className="font-semibold text-slate-700">
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

              <div className="flex items-center gap-2">
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
