import React from 'react';
import {
  History,
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  PowerOff,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';

export const HistoryLogsView: React.FC = () => {
  const { surveyLogs, language, setActiveView } = useApp();
  const t = translations[language];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('consumers')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Field Survey History & Watermark Proof
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Chronological log of lineman actions with GPS coordinates, timestamps, and camera proof
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
          {surveyLogs.length} Records
        </span>
      </div>

      {/* Logs Feed */}
      <div className="space-y-3">
        {surveyLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            No survey actions logged yet. Start by updating any consumer on the home screen!
          </div>
        ) : (
          surveyLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    #{log.consumerId}
                  </span>
                  <span className="font-extrabold text-slate-900 text-base">
                    {log.consumerName}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">
                    Agency {log.agency}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                      log.action === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.action === 'disconnected'
                        ? 'bg-red-100 text-red-800'
                        : log.action === 'dispute'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {log.action}
                  </span>
                </div>

                {log.amountRealized > 0 && (
                  <p className="text-sm font-bold text-emerald-700 font-mono">
                    Realized Amount: {formatINR(log.amountRealized)}
                  </p>
                )}

                {log.remarks && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg italic">
                    "{log.remarks}"
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {log.userId}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {log.lat.toFixed(4)}, {log.long.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Watermark Photo thumbnail if attached */}
              {log.photoUrl && (
                <div className="shrink-0 flex flex-col items-end">
                  <a
                    href={log.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative rounded-xl overflow-hidden border border-slate-300"
                  >
                    <img
                      src={log.photoUrl}
                      alt="Watermarked Proof"
                      className="w-36 h-24 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      View Full
                    </div>
                  </a>
                  <a
                    href={log.photoUrl}
                    download={`Evidence_${log.consumerId}.jpg`}
                    className="mt-1 text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Evidence</span>
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
