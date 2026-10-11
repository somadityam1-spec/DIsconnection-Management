import React from 'react';
import { X, Check, Palette, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeMode } from '../types';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, showToast } = useApp();

  if (!isOpen) return null;

  const themes: {
    id: ThemeMode;
    name: string;
    description: string;
    preview: {
      header: string;
      btn: string;
      bg: string;
      badge: string;
    };
  }[] = [
    {
      id: 'official_white',
      name: 'Official Clean White (Screenshot Original)',
      description: 'Crisp white top navigation, royal blue primary buttons, high-contrast dark card CTAs.',
      preview: {
        header: 'bg-white border border-slate-300',
        btn: 'bg-blue-600 text-white',
        bg: 'bg-slate-100',
        badge: 'bg-purple-100 text-purple-800',
      },
    },
    {
      id: 'electric_blue',
      name: 'WBSEDCL Royal Electric Blue',
      description: 'Classic utility blue top header, vibrant blue accents, bold white text.',
      preview: {
        header: 'bg-blue-700 text-white',
        btn: 'bg-blue-600 text-white',
        bg: 'bg-slate-100',
        badge: 'bg-amber-400 text-blue-950',
      },
    },
    {
      id: 'emerald_pro',
      name: 'Emerald Energy Field Green',
      description: 'Professional forest emerald header, mint status badges, eco-utility aesthetic.',
      preview: {
        header: 'bg-emerald-800 text-white',
        btn: 'bg-emerald-600 text-white',
        bg: 'bg-emerald-50/50',
        badge: 'bg-emerald-100 text-emerald-800',
      },
    },
    {
      id: 'night_shift',
      name: 'Night Shift & Field Dark Mode',
      description: 'High-contrast dark slate theme optimized for evening field surveys and battery efficiency.',
      preview: {
        header: 'bg-slate-900 border border-slate-700 text-white',
        btn: 'bg-blue-500 text-white',
        bg: 'bg-slate-950',
        badge: 'bg-purple-900 text-purple-200',
      },
    },
  ];

  const handleSelect = (selectedId: ThemeMode) => {
    setTheme(selectedId);
    showToast(`Color theme updated to ${selectedId.replace('_', ' ').toUpperCase()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Customize App Color Theme
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            Select your preferred visual scheme for daylight, office management, or night field inspections:
          </p>

          <div className="space-y-3">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{t.name}</span>
                      {isSelected && (
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{t.description}</p>

                    {/* Miniature Color Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className={`h-4 w-12 rounded ${t.preview.header}`} />
                      <div className={`h-4 w-8 rounded ${t.preview.btn}`} />
                      <div className={`h-4 w-6 rounded ${t.preview.badge}`} />
                    </div>
                  </div>

                  <div className="pt-1">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
