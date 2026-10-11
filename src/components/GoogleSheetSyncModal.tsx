import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Link,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ArrowLeft,
  Copy,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';
import { parseCSVToConsumers, exportConsumersToCSV } from '../utils/sheetSync';

export const GoogleSheetSyncModal: React.FC = () => {
  const {
    syncConfig,
    updateSyncConfig,
    syncWithGoogleSheet,
    consumers,
    language,
    setActiveView,
    showToast,
    addConsumer,
  } = useApp();

  const t = translations[language];

  const [sheetUrl, setSheetUrl] = useState(syncConfig.sheetWebUrl);
  const [webhookUrl, setWebhookUrl] = useState(syncConfig.webhookUrl);
  const [pastedCSV, setPastedCSV] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveAndSync = async () => {
    updateSyncConfig({
      sheetWebUrl: sheetUrl,
      webhookUrl: webhookUrl,
    });
    setIsSyncing(true);
    await syncWithGoogleSheet(sheetUrl);
    setIsSyncing(false);
  };

  const handleImportPastedCSV = () => {
    if (!pastedCSV.trim()) {
      showToast('Please paste valid CSV data');
      return;
    }
    const parsed = parseCSVToConsumers(pastedCSV);
    if (parsed.length === 0) {
      showToast('No valid consumer records found in pasted CSV');
      return;
    }

    parsed.forEach((c) => addConsumer(c));
    showToast(`Successfully imported ${parsed.length} consumers from CSV!`);
    setPastedCSV('');
  };

  const sampleAppsScriptCode = `// Google Apps Script for Real-Time 2-Way Sync
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  // Append or update row: Consumer ID, Name, Action, Realized ₹, Agency, Surveyor, Time
  sheet.appendRow([
    data.consumerId,
    data.consumerName,
    data.action,
    data.amountRealized,
    data.agency,
    data.surveyor,
    data.timestamp,
    data.lat + ',' + data.lng,
    data.remarks
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({result: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('consumers')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.syncFreshData}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live Google Sheets Synchronization for Harishchandrapur Field Operations
            </p>
          </div>
        </div>

        <button
          onClick={() => exportConsumersToCSV(consumers)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-emerald-950 text-sm">
              Live Sheet Engine Active
            </h4>
            <p className="text-xs text-emerald-700">
              {syncConfig.lastSyncTime
                ? `Last synchronized: ${syncConfig.lastSyncTime}`
                : 'Current database initialized with 700 Harishchandrapur records'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAndSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Google Sheet Web Link & Webhook Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Link className="w-5 h-5 text-blue-600" />
          <span>Google Sheet Connection Settings</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Google Sheet Published Web Link (CSV)
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              In Google Sheets: Click <b>File</b> → <b>Share</b> → <b>Publish to web</b> → Select <b>Entire Document</b> or Sheet → Choose <b>Comma-separated values (.csv)</b> → Click <b>Publish</b> and copy the link.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Google Apps Script Real-Time Webhook URL (Optional for instant sheet writes)
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Whenever a surveyor disconnects, collects payment, or records a dispute, the action is dispatched in real time to this endpoint.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Save & Pull Latest Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Direct CSV Paste / Quick Import */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          <span>Direct CSV Text Import / Paste</span>
        </h3>
        <p className="text-xs text-slate-500">
          You can copy and paste rows directly from your Google Sheet or Excel spreadsheet (Headers: Consumer id, Name, Address, Class, OSD, MRU, Mobile no, Lat, Long, Meter number, Agency, Issued date):
        </p>

        <textarea
          rows={4}
          placeholder="Consumer id,Name,Address,Class,OSD,MRU,Mobile no,Lat,Long,Meter number,Agency,Issued date..."
          value={pastedCSV}
          onChange={(e) => setPastedCSV(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800"
        />

        <div className="flex justify-end">
          <button
            onClick={handleImportPastedCSV}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer"
          >
            Import Pasted Records
          </button>
        </div>
      </div>

      {/* Google Apps Script Helper Accordion */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            Google Sheet Webhook Code Template
          </h4>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sampleAppsScriptCode);
              showToast('Copied Apps Script code to clipboard');
            }}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Code</span>
          </button>
        </div>
        <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto">
          {sampleAppsScriptCode}
        </pre>
      </div>
    </div>
  );
};
