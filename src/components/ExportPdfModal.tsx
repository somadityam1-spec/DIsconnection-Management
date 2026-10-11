import React, { useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  Building,
  CheckCircle,
  FileText,
  SlidersHorizontal,
  Eye,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Consumer } from '../types';
import { translations, formatINR } from '../utils/translations';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  consumers,
}) => {
  const {
    currentUser,
    language,
    selectedAgencyFilter,
    selectedClassFilter,
    selectedStatusFilter,
    minOsdFilter,
    searchQuery,
  } = useApp();

  const t = translations[language];

  // Options
  const [docTitle, setDocTitle] = useState('FIELD DISCONNECTION & RECOVERY NOTICE LIST');
  const [includeAddress, setIncludeAddress] = useState(true);
  const [includeMeterAndMru, setIncludeMeterAndMru] = useState(true);
  const [includeSignatureCol, setIncludeSignatureCol] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen) return null;

  const totalOsd = consumers.reduce((sum, c) => sum + c.osd, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    const printContent = document.getElementById('printable-field-document')?.innerHTML;
    if (!printContent) return;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>WBSEDCL_DC_List_${new Date().toISOString().slice(0, 10)}</title>
        <style>
          @page { size: A4 ${orientation}; margin: 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #475569; padding: 5px 6px; text-align: left; font-size: 10px; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 12px; font-weight: bold; color: #334155; margin-top: 2px; }
          .meta { font-size: 10px; color: #475569; margin-top: 4px; display: flex; justify-content: space-between; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .signatures { margin-top: 35px; display: flex; justify-content: space-between; text-align: center; font-size: 10px; }
          .sig-line { width: 160px; border-top: 1px solid #000; padding-top: 4px; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WBSEDCL_DC_List_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Modal Wrapper - Non-print container */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in-50 zoom-in-95">
        
        {/* Header toolbar (Hidden during print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Export Filtered DC List to PDF
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generates an official printer-ready document for field surveyors & office review
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHTML}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Save HTML</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Hidden during print) */}
        <div className="no-print px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-slate-500 uppercase flex items-center gap-1 text-[11px]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Include:
            </span>

            <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAddress}
                onChange={(e) => setIncludeAddress(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Full Address</span>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMeterAndMru}
                onChange={(e) => setIncludeMeterAndMru(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Meter & MRU</span>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSignatureCol}
                onChange={(e) => setIncludeSignatureCol(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Signature Column</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 text-[11px]">Page Orientation:</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="portrait">Portrait (Vertical)</option>
              <option value="landscape">Landscape (Wide)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Printable Document View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/50">
          <div
            id="printable-field-document"
            className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto print-card"
          >
            {/* 1. Official Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building className="w-5 h-5 text-blue-700" />
                <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900">
                  West Bengal State Electricity Distribution Company Limited (WBSEDCL)
                </h1>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                HARISHCHANDRAPUR CCC (OFFICE CODE: 6612106) · MALDA REGION
              </h2>
              <h3 className="text-xs font-bold text-blue-800 uppercase mt-1">
                {docTitle}
              </h3>

              {/* Metadata Badges Strip */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-2 font-mono">
                <div>
                  <span>DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="mx-2">·</span>
                  <span>GENERATED BY: {currentUser?.name || 'ADMIN'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900">BATCH COUNT: {consumers.length} CONSUMERS</span>
                  <span className="mx-2">·</span>
                  <span className="font-bold text-rose-700">TOTAL DUE: {formatINR(totalOsd)}</span>
                </div>
              </div>

              {/* Active Filter Criteria Summary */}
              <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between font-mono bg-slate-50 px-2.5 py-1 rounded">
                <span>
                  FILTER CRITERIA: Agency: {selectedAgencyFilter} | Class: {selectedClassFilter} | Status: {selectedStatusFilter}
                  {minOsdFilter > 0 ? ` | Min OSD: ≥ ₹${minOsdFilter.toLocaleString('en-IN')}` : ''}
                </span>
                {searchQuery && <span>Search: "{searchQuery}"</span>}
              </div>
            </div>

            {/* 2. Consumers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border border-slate-400 font-bold">
                    <th className="py-2 px-2 text-center w-8 border border-slate-400">Sl</th>
                    <th className="py-2 px-2.5 border border-slate-400">Consumer ID</th>
                    <th className="py-2 px-2.5 border border-slate-400">Consumer Name</th>
                    {includeAddress && (
                      <th className="py-2 px-2.5 border border-slate-400 max-w-[160px]">Address</th>
                    )}
                    <th className="py-2 px-2 border border-slate-400 text-center">Class</th>
                    {includeMeterAndMru && (
                      <>
                        <th className="py-2 px-2 border border-slate-400">MRU</th>
                        <th className="py-2 px-2 border border-slate-400">Meter No</th>
                      </>
                    )}
                    <th className="py-2 px-2 border border-slate-400">Mobile No</th>
                    <th className="py-2 px-2.5 border border-slate-400 text-right">OSD Due (₹)</th>
                    <th className="py-2 px-2 border border-slate-400 text-center">Status</th>
                    {includeSignatureCol && (
                      <th className="py-2 px-3 border border-slate-400 text-center w-28">
                        Lineman / Consumer Sign
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono text-[10px]">
                  {consumers.map((c, idx) => (
                    <tr key={c.id} className="border border-slate-300">
                      <td className="py-2 px-1.5 text-center text-slate-600 border border-slate-300 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 font-bold text-slate-900">
                        {c.id}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 font-sans font-bold text-slate-900">
                        {c.name}
                      </td>
                      {includeAddress && (
                        <td className="py-2 px-2 border border-slate-300 font-sans text-slate-600 text-[10px] leading-tight">
                          {c.address}
                        </td>
                      )}
                      <td className="py-2 px-1.5 text-center border border-slate-300 font-bold">
                        {c.class}
                      </td>
                      {includeMeterAndMru && (
                        <>
                          <td className="py-2 px-1.5 border border-slate-300 text-slate-700">
                            {c.mru}
                          </td>
                          <td className="py-2 px-1.5 border border-slate-300 text-slate-700">
                            {c.meterNo}
                          </td>
                        </>
                      )}
                      <td className="py-2 px-1.5 border border-slate-300 text-slate-800">
                        {c.mobileNo}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-right font-bold text-slate-900 tabular-nums">
                        <div>{formatINR(c.osd)}</div>
                        {c.osd >= 10000 ? (
                          <span className="text-[8px] font-black text-purple-700 block">≥ 10K High</span>
                        ) : c.osd >= 5000 ? (
                          <span className="text-[8px] font-bold text-rose-700 block">≥ 5K</span>
                        ) : c.osd >= 3000 ? (
                          <span className="text-[8px] font-bold text-amber-700 block">≥ 3K</span>
                        ) : null}
                      </td>
                      <td className="py-2 px-1.5 border border-slate-300 text-center uppercase font-bold text-[9px]">
                        <span
                          className={`px-1 py-0.5 rounded ${
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
                      {includeSignatureCol && (
                        <td className="py-2 px-2 border border-slate-300 text-center">
                          <div className="h-6 border-b border-dashed border-slate-400"></div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Total summary row */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-500 text-slate-900">
                    <td colSpan={includeAddress ? 3 : 2} className="py-2.5 px-3 font-sans text-left">
                      Total ({consumers.length} Consumers)
                    </td>
                    <td
                      colSpan={includeMeterAndMru ? 4 : 2}
                      className="py-2.5 px-2 text-right font-sans text-slate-600 text-[10px]"
                    >
                      Batch Cumulative Outstanding:
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                      {formatINR(totalOsd)}
                    </td>
                    <td colSpan={includeSignatureCol ? 2 : 1}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3. Official Signatures Block */}
            <div className="mt-12 pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-[10px] font-semibold text-slate-700">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-mono">
                  FIELD SURVEYOR / LINEMAN
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-mono">
                  TECHNICAL IN-CHARGE (CCC)
                </div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-slate-400 pt-1 font-mono">
                  ASSISTANT ENGINEER & SM (AE)
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-6 text-center text-[9px] text-slate-400 font-mono">
              Official WBSEDCL Document · Malda Division · Harishchandrapur CCC (6612106)
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="no-print p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Ready to print {consumers.length} records · Tip: Choose "Save as PDF" in print destinations
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
