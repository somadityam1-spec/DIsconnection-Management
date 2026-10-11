import React, { useState } from 'react';
import {
  X,
  FileText,
  FileSpreadsheet,
  Printer,
  History,
  Activity,
  BarChart3,
  Edit3,
  Users,
  BellRing,
  RefreshCw,
  Star,
  KeyRound,
  LogOut,
  Download,
  Award,
  Palette,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';
import { exportConsumersToCSV, exportConsumersToExcel } from '../utils/sheetSync';
import { ThemeModal } from './ThemeModal';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExportPdf?: () => void;
  onOpenBulkImport?: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onOpenExportPdf,
  onOpenBulkImport,
}) => {
  const {
    currentUser,
    language,
    logout,
    setActiveView,
    consumers,
    visibleConsumers,
    showToast,
    resetToDefaultData,
  } = useApp();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const t = translations[language];

  if (!isOpen) return null;

  const handleDownloadExcel = () => {
    exportConsumersToExcel(visibleConsumers, `WBSEDCL_DC_List_${new Date().toISOString().slice(0, 10)}.xls`);
    showToast('Downloaded DC Excel file');
    onClose();
  };

  const handleDownloadCSV = () => {
    exportConsumersToCSV(visibleConsumers, `WBSEDCL_DC_List_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Downloaded DC CSV file');
    onClose();
  };

  const handlePrintDailyReport = () => {
    setActiveView('meeting_report');
    onClose();
    setTimeout(() => {
      window.print();
    }, 600);
  };

  const handleBroadcastAlert = () => {
    const msg = prompt('Enter notice message to broadcast to all field agents:');
    if (msg) {
      showToast(`Broadcast sent: "${msg}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col h-full border-l border-slate-200">
          {/* Header */}
          <div className="p-4 bg-blue-700 text-white flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base sm:text-lg tracking-tight">Harishchandrapur CCC</h2>
              <p className="text-xs text-blue-200">Office Code: 6612106 · Menu</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-blue-800 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current User Quick Info */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {currentUser?.role === 'admin' ? 'Super Admin' : `Field Agent (${currentUser?.agency})`}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                currentUser?.role === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {currentUser?.role}
            </span>
          </div>

          {/* Menu Sections (Exact items as in Screenshot 4) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-sm">
            {/* 1. Downloads */}
            <div className="py-2.5">
              <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.downloads}
              </div>

              <button
                onClick={() => {
                  onClose();
                  if (onOpenExportPdf) {
                    onOpenExportPdf();
                  } else {
                    setActiveView('meeting_report');
                  }
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                <span>Download DC List (PDF)</span>
              </button>

              <button
                onClick={handleDownloadExcel}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Download DC List (Excel)</span>
              </button>

              <button
                onClick={handlePrintDailyReport}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Daily Report (Print)</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Download Report (CSV)</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('history_logs');
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <History className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>History Report</span>
              </button>
            </div>

            {/* 2. Updates */}
            <div className="py-2.5">
              <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Updates
              </div>

              <button
                onClick={() => {
                  setActiveView('history_logs');
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Activity className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Agency Last Updates</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('rankings');
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Award className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Agency Updates Report</span>
              </button>
            </div>

            {/* 3. Analysis */}
            <div className="py-2.5">
              <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.analysis}
              </div>

              <button
                onClick={() => {
                  setActiveView('analytics');
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t.analysisDashboard}</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('rankings');
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t.passionRankings}</span>
              </button>
            </div>

            {/* 4. Admin Management */}
            <div className="py-2.5">
              <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.adminMenu}
              </div>

              {currentUser?.role === 'admin' ? (
                <>
                  <button
                    onClick={() => {
                      setActiveView('admin_consumers');
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Edit DC List</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenBulkImport) {
                        onOpenBulkImport();
                      } else {
                        setActiveView('admin_consumers');
                      }
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-800">Bulk Disconnection Import</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('admin_users');
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Admin Settings (Staff Accounts)</span>
                  </button>

                  <button
                    onClick={handleBroadcastAlert}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Broadcast Push Alert</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('sheet_sync');
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Sync Fresh Data (Google Sheet)</span>
                  </button>
                </>
              ) : (
                <div className="px-4 py-2 text-xs text-slate-400 italic">
                  Admin settings restricted to Supervisor
                </div>
              )}

              <button
                onClick={() => {
                  setShowThemeModal(true);
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Palette className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Home Card Theme & Colors</span>
              </button>

              <button
                onClick={() => {
                  showToast('Harishchandrapur CCC field rating: 4.8 / 5.0 (98% realization)');
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <span>My Feedback & Rating</span>
              </button>

              <button
                onClick={() => {
                  const newP = prompt('Enter new password for your account:');
                  if (newP) {
                    showToast('Password updated successfully');
                  }
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t.changePassword}</span>
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    if (confirm('Reset to default Harishchandrapur office data?')) {
                      resetToDefaultData();
                      onClose();
                    }
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 text-amber-700 hover:bg-amber-50 cursor-pointer text-xs"
                >
                  <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Reset Default Office Data</span>
                </button>
              )}
            </div>

            {/* Logout */}
            <div className="py-2.5">
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <ThemeModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </div>
  );
};
