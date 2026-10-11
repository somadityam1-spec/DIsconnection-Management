import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';

export const LoginView: React.FC = () => {
  const { login, language, toggleLanguage } = useApp();
  const t = translations[language];

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = login(userId, password);
    if (!success) {
      setError('Invalid User ID or Password. Please contact Harishchandrapur office admin.');
    }
  };

  const handleQuickLogin = (uId: string, pass: string) => {
    setUserId(uId);
    setPassword(pass);
    login(uId, pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 via-blue-800 to-slate-900 flex flex-col justify-center items-center px-4 py-8">
      {/* Language Switch floating at top right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-md transition-colors cursor-pointer border border-white/30"
        >
          <span className={language === 'en' ? 'text-amber-300 font-extrabold' : 'text-blue-100'}>
            English
          </span>
          <span className="text-white/40">|</span>
          <span className={language === 'bn' ? 'text-amber-300 font-extrabold' : 'text-blue-100'}>
            বাংলা
          </span>
        </button>
      </div>

      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6 text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-3">
            <Zap className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t.appTitle}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-sm mx-auto font-medium">
            {t.subTitle}
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-[11px] font-mono text-blue-200">
            OFFICE CODE: {t.officeCode} · MALDA REGION
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.userIdLabel}
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. harishchandrapur, agency_ac"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your assigned password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{t.loginBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Access (Matches prompt: harishchandrapur / admin) */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Quick Office Role Login
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('harishchandrapur', 'admin')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-blue-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Office Admin</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ID: harishchandrapur
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Pass: admin
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('agency_ac', 'user123')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1 font-bold text-emerald-900">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Field Agent (AC)</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  ID: agency_ac
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Pass: user123
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-blue-200/80 mt-6 font-mono">
          WBSEDCL Utility Disconnection & Revenue Operations
        </p>
      </div>
    </div>
  );
};
