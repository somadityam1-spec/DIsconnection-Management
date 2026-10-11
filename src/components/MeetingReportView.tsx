import React from 'react';
import {
  Printer,
  Download,
  ArrowLeft,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  PowerOff,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';
import { exportConsumersToExcel } from '../utils/sheetSync';

export const MeetingReportView: React.FC = () => {
  const { consumers, language, setActiveView } = useApp();
  const t = translations[language];

  const totalOsd = consumers.reduce((sum, c) => sum + c.osd, 0);
  const totalRealized = consumers.reduce((sum, c) => {
    if (c.status === 'paid') return sum + (c.amountRealized || c.osd);
    return sum;
  }, 0);
  const disconnectedCount = consumers.filter((c) => c.status === 'disconnected').length;
  const paidCount = consumers.filter((c) => c.status === 'paid').length;
  const disputeCount = consumers.filter((c) => c.status === 'dispute').length;
  const notFoundCount = consumers.filter((c) => c.status === 'not_found').length;
  const connectedCount = consumers.filter((c) => c.status === 'connected' || c.status === 'reissued').length;

  const recoveryPct = totalOsd > 0 ? (totalRealized / totalOsd) * 100 : 0;

  // Class wise breakdown
  const classes = ['A', 'B', 'C', 'D'];
  const classBreakdown = classes.map((cls) => {
    const list = consumers.filter((c) => c.class.toUpperCase() === cls);
    const osd = list.reduce((sum, c) => sum + c.osd, 0);
    const realized = list.reduce(
      (sum, c) => (c.status === 'paid' ? sum + (c.amountRealized || c.osd) : sum),
      0
    );
    const dcCount = list.filter((c) => c.status === 'disconnected').length;
    const pCount = list.filter((c) => c.status === 'paid').length;
    return {
      class: cls,
      count: list.length,
      osd,
      realized,
      realizationRate: osd > 0 ? (realized / osd) * 100 : 0,
      dcCount,
      pCount,
    };
  });

  // High Value Defaulters (> ₹35,000)
  const highValueDefaulters = consumers
    .filter((c) => c.osd >= 35000 && c.status !== 'paid')
    .sort((a, b) => b.osd - a.osd);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Action Header (hidden in print) */}
      <div className="no-print flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveView('consumers')}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-bold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportConsumersToExcel(consumers, 'Meeting_Report_WBSEDCL.xls')}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF Report</span>
          </button>
        </div>
      </div>

      {/* Official Meeting Report Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 print-card shadow-xs">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Building className="w-6 h-6 text-blue-700" />
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
              West Bengal State Electricity Distribution Company Limited (WBSEDCL)
            </h1>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-700">
            HARISHCHANDRAPUR CCC (OFFICE CODE: 6612106) · MALDA DIVISION
          </h2>
          <div className="mt-2 text-xs text-slate-500 font-mono flex items-center justify-center gap-4">
            <span>DISCONNECTION & REVENUE RECOVERY (OSD) REVIEW</span>
            <span>·</span>
            <span>DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            1. Executive Recovery Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Total DC Consumers</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{consumers.length}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Total OSD Outstanding</span>
              <p className="text-lg font-black text-rose-600 font-mono mt-0.5 tabular-nums">
                {formatINR(totalOsd)}
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-800 font-medium">Total Realized Dues</span>
              <p className="text-lg font-black text-emerald-700 font-mono mt-0.5 tabular-nums">
                {formatINR(totalRealized)}
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-800 font-medium">Recovery Realization %</span>
              <p className="text-xl font-black text-blue-700 font-mono mt-0.5 tabular-nums">
                {recoveryPct.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Action Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-medium">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-slate-500 block text-[11px]">Connected</span>
            <span className="text-base font-bold text-slate-800 font-mono">{connectedCount}</span>
          </div>
          <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-center">
            <span className="text-red-700 block text-[11px]">Disconnected</span>
            <span className="text-base font-bold text-red-800 font-mono">{disconnectedCount}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
            <span className="text-emerald-700 block text-[11px]">Paid / Realized</span>
            <span className="text-base font-bold text-emerald-800 font-mono">{paidCount}</span>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <span className="text-amber-700 block text-[11px]">Disputes</span>
            <span className="text-base font-bold text-amber-800 font-mono">{disputeCount}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-slate-500 block text-[11px]">Not Found</span>
            <span className="text-base font-bold text-slate-800 font-mono">{notFoundCount}</span>
          </div>
        </div>

        {/* Class-wise Breakdown Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            2. Class-Wise Analysis (A, B, C, D)
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-right">Consumers</th>
                  <th className="py-2.5 px-3 text-right">Total OSD (₹)</th>
                  <th className="py-2.5 px-3 text-right">Realized (₹)</th>
                  <th className="py-2.5 px-3 text-right">Realization %</th>
                  <th className="py-2.5 px-3 text-right">Disconnected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {classBreakdown.map((row) => (
                  <tr key={row.class}>
                    <td className="py-2 px-3 font-sans font-bold">Class {row.class}</td>
                    <td className="py-2 px-3 text-right">{row.count}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{formatINR(row.osd)}</td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">{formatINR(row.realized)}</td>
                    <td className="py-2 px-3 text-right font-bold">{row.realizationRate.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-red-700 font-bold">{row.dcCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High-Value Defaulters Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            3. High-Value Priority Defaulter Premises (&gt; ₹35,000 Unpaid)
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Consumer Name</th>
                  <th className="py-2 px-3">Address</th>
                  <th className="py-2 px-2 text-right">OSD (₹)</th>
                  <th className="py-2 px-2">Agency</th>
                  <th className="py-2 px-2">Meter No</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {highValueDefaulters.slice(0, 8).map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-bold text-blue-700">{c.id}</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">{c.name}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 max-w-[200px] truncate">{c.address}</td>
                    <td className="py-2 px-2 text-right font-bold text-rose-600">{formatINR(c.osd)}</td>
                    <td className="py-2 px-2">{c.agency}</td>
                    <td className="py-2 px-2 text-slate-600">{c.meterNo}</td>
                    <td className="py-2 px-2 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs font-semibold text-slate-600">
          <div>
            <div className="h-10"></div>
            <p className="border-t border-slate-400 pt-1">Field Survey Coordinator</p>
          </div>
          <div>
            <div className="h-10"></div>
            <p className="border-t border-slate-400 pt-1">Station Technical In-Charge</p>
          </div>
          <div>
            <div className="h-10"></div>
            <p className="border-t border-slate-400 pt-1">Sub-Divisional AE / Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};
