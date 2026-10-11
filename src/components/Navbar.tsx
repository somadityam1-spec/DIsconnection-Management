import React, { useState } from 'react';
import {
  Menu,
  Home,
  User as UserIcon,
  MoreVertical,
  LogOut,
  Settings,
  Languages,
  ShieldCheck,
  FileSpreadsheet,
  Trophy,
  Palette,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';
import { ThemeModal } from './ThemeModal';

interface NavbarProps {
  onOpenDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDrawer }) => {
  const {
    currentUser,
    language,
    toggleLanguage,
    logout,
    activeView,
    setActiveView,
    theme,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const t = translations[language];

  // Dynamic Theme Styling for the Top Navigation Bar
  const getHeaderStyles = () => {
    switch (theme) {
      case 'official_white':
        return {
          header: 'bg-white text-slate-800 shadow-xs border-b border-slate-200',
          menuBtn: 'text-slate-700 hover:bg-slate-100',
          homeBtnActive: 'bg-blue-50 text-blue-600',
          homeBtnInactive: 'text-slate-600 hover:bg-slate-100',
          langBtn: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
          title: 'text-slate-900',
          subtitle: 'text-slate-500',
          agencyBadge: 'bg-purple-100 text-purple-800',
          avatarContainer: 'bg-blue-50 border border-blue-200 text-blue-600',
          moreBtn: 'text-slate-700 hover:bg-slate-100',
          rankBtn: 'text-slate-700 border-slate-200 hover:bg-slate-50',
        };
      case 'emerald_pro':
        return {
          header: 'bg-emerald-800 text-white shadow-md border-b border-emerald-900',
          menuBtn: 'text-white hover:bg-emerald-900',
          homeBtnActive: 'bg-emerald-900 text-emerald-200',
          homeBtnInactive: 'text-white hover:bg-emerald-900',
          langBtn: 'bg-emerald-900 hover:bg-emerald-950 text-white border border-emerald-700',
          title: 'text-white',
          subtitle: 'text-emerald-200',
          agencyBadge: 'bg-amber-400 text-emerald-950',
          avatarContainer: 'bg-emerald-900 border border-emerald-700 text-emerald-100',
          moreBtn: 'text-white hover:bg-emerald-900',
          rankBtn: 'text-white border-emerald-700 hover:bg-emerald-900',
        };
      case 'night_shift':
        return {
          header: 'bg-slate-900 text-slate-100 shadow-md border-b border-slate-800',
          menuBtn: 'text-slate-200 hover:bg-slate-800',
          homeBtnActive: 'bg-slate-800 text-blue-400',
          homeBtnInactive: 'text-slate-300 hover:bg-slate-800',
          langBtn: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
          title: 'text-white',
          subtitle: 'text-slate-400',
          agencyBadge: 'bg-purple-900 text-purple-200',
          avatarContainer: 'bg-slate-800 border border-slate-700 text-blue-400',
          moreBtn: 'text-slate-200 hover:bg-slate-800',
          rankBtn: 'text-slate-200 border-slate-700 hover:bg-slate-800',
        };
      case 'electric_blue':
      default:
        return {
          header: 'bg-blue-700 text-white shadow-md border-b border-blue-800',
          menuBtn: 'text-white hover:bg-blue-800',
          homeBtnActive: 'bg-blue-800/90 text-white',
          homeBtnInactive: 'text-white hover:bg-blue-800',
          langBtn: 'bg-blue-800/90 hover:bg-blue-900 text-white border border-blue-400/40',
          title: 'text-white',
          subtitle: 'text-blue-200',
          agencyBadge: 'bg-amber-400 text-blue-950',
          avatarContainer: 'bg-blue-800 border border-blue-400/40 text-blue-100',
          moreBtn: 'text-white hover:bg-blue-800',
          rankBtn: 'text-white border-blue-400/30 hover:bg-blue-800',
        };
    }
  };

  const styles = getHeaderStyles();

  return (
    <>
      <header className={`sticky top-0 z-30 transition-colors ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Hamburger Drawer + Home button + Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenDrawer}
              aria-label="Open navigation menu"
              className={`p-2 -ml-1 rounded-lg transition-colors cursor-pointer ${styles.menuBtn}`}
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={() => setActiveView('consumers')}
              aria-label="Go to home"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeView === 'consumers' ? styles.homeBtnActive : styles.homeBtnInactive
              }`}
            >
              <Home className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>

            {/* Bilingual English / Bengali Toggle directly in top bar as in screenshot */}
            <button
              onClick={toggleLanguage}
              title="Toggle English / বাংলা"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-full transition-colors cursor-pointer ${styles.langBtn}`}
            >
              <span className={language === 'en' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}>E</span>
              <span className="text-slate-400">|</span>
              <span className={language === 'bn' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}>বা</span>
            </button>
          </div>

          {/* Center / User info as shown in screenshot: "Harishchandra... 6612106" */}
          <div className="flex items-center gap-2 truncate text-right sm:text-center">
            <div className="flex flex-col items-end sm:items-center">
              <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-tight truncate max-w-[150px] sm:max-w-[240px] ${styles.title}`}>
                {currentUser?.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 inline" />
                ) : null}
                <span className="truncate">
                  {currentUser?.name ? currentUser.name.split(' ')[0] : 'Harishchandrapur'}
                </span>
                {currentUser?.agency && currentUser.agency !== 'ALL' && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${styles.agencyBadge}`}>
                    {currentUser.agency}
                  </span>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs font-mono tracking-wider ${styles.subtitle}`}>
                {t.officeCode} · {currentUser?.role === 'admin' ? 'ADMIN' : 'SURVEYOR'}
              </span>
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${styles.avatarContainer}`}>
              <UserIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Right: Color Palette button & 3-dots more menu */}
          <div className="relative flex items-center gap-1 shrink-0">
            {/* Quick Color Palette Switcher */}
            <button
              onClick={() => setThemeModalOpen(true)}
              title="Change Color Theme"
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${styles.moreBtn}`}
            >
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setActiveView('rankings')}
                title={t.passionRankings}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                  activeView === 'rankings'
                    ? 'bg-amber-400 text-blue-950 font-bold'
                    : styles.rankBtn
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Rankings</span>
              </button>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="More options"
              className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${styles.moreBtn}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* 3-dots popover */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {currentUser?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {currentUser?.id} ({currentUser?.role})
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setThemeModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>Change Color Theme</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('rankings');
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>{t.passionRankings}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('meeting_report');
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{t.dailyReport}</span>
                  </button>

                  {currentUser?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          setActiveView('admin_users');
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-blue-600" />
                        <span>{t.adminSettings}</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveView('sheet_sync');
                          setMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>{t.syncFreshData}</span>
                      </button>
                    </>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Theme Picker Modal */}
      <ThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
    </>
  );
};
