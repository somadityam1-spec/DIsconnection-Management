import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Download,
  DollarSign,
  PowerOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Building,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';
import { Consumer } from '../types';

interface StatsBreakdownProps {
  forceOpen?: boolean;
}

export const StatsBreakdown: React.FC<StatsBreakdownProps> = ({ forceOpen }) => {
  const {
    consumers,
    language,
    selectedAgencyFilter,
    setSelectedAgencyFilter,
    selectedClassFilter,
    setSelectedClassFilter,
  } = useApp();

  const [isOpen, setIsOpen] = useState(forceOpen !== undefined ? forceOpen : true);
  const t = translations[language];

  // Helper for pure rupee format without decimals e.g. ₹1,500, ₹12,380, ₹0
  const formatRupee = (val: number): string => {
    return '₹' + Math.round(val || 0).toLocaleString('en-IN');
  };

  // Distinct agencies and classes
  const agencyList = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach((c) => {
      if (c.agency) set.add(c.agency.trim().toUpperCase());
    });
    return ['All', ...Array.from(set).sort()];
  }, [consumers]);

  const classList = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach((c) => {
      if (c.class) set.add(c.class.trim().toUpperCase());
    });
    return ['All', ...Array.from(set).sort()];
  }, [consumers]);

  // Filtered consumers for the top KPI metric cards
  const statsConsumers = useMemo(() => {
    return consumers.filter((c) => {
      if (selectedAgencyFilter !== 'All') {
        const ag = c.agency ? c.agency.trim().toUpperCase() : '';
        if (ag !== selectedAgencyFilter.toUpperCase()) return false;
      }
      if (selectedClassFilter !== 'All') {
        const cls = c.class ? c.class.trim().toUpperCase() : '';
        if (cls !== selectedClassFilter.toUpperCase()) return false;
      }
      return true;
    });
  }, [consumers, selectedAgencyFilter, selectedClassFilter]);

  // Top KPI aggregate numbers
  const aggregates = useMemo(() => {
    const res = {
      totalCount: statsConsumers.length,
      totalOsd: statsConsumers.reduce((sum, c) => sum + (c.osd || 0), 0),
      connectedCount: 0,
      connectedOsd: 0,
      disconnectedCount: 0,
      disconnectedOsd: 0,
      paidCount: 0,
      paidOsd: 0,
      officeTeamCount: 0,
      officeTeamOsd: 0,
      billDisputeCount: 0,
      billDisputeOsd: 0,
      notFoundCount: 0,
      notFoundOsd: 0,
    };

    statsConsumers.forEach((c) => {
      switch (c.status) {
        case 'connected':
        case 'reissued':
          res.connectedCount++;
          res.connectedOsd += c.osd || 0;
          break;
        case 'disconnected':
          res.disconnectedCount++;
          res.disconnectedOsd += c.osd || 0;
          break;
        case 'paid':
          res.paidCount++;
          res.paidOsd += c.amountRealized || c.osd || 0;
          break;
        case 'office_team':
          res.officeTeamCount++;
          res.officeTeamOsd += c.osd || 0;
          break;
        case 'dispute':
          res.billDisputeCount++;
          res.billDisputeOsd += c.osd || 0;
          break;
        case 'not_found':
          res.notFoundCount++;
          res.notFoundOsd += c.osd || 0;
          break;
      }
    });

    return res;
  }, [statsConsumers]);

  // Agency display mapper (e.g. JG -> JOY GURU)
  const getAgencyDisplayName = (agencyCode: string) => {
    const code = (agencyCode || '').trim();
    if (code.toUpperCase() === 'JG') return 'JOY GURU';
    return code;
  };

  // Cross-agency performance matrix (matching reference screenshot)
  const agencyMatrix = useMemo(() => {
    const agencies = Array.from(
      new Set(consumers.map((c) => (c.agency ? c.agency.trim().toUpperCase() : 'AC')))
    ).sort();

    return agencies.map((agency) => {
      const agencyConsumers = consumers.filter(
        (c) => (c.agency ? c.agency.trim().toUpperCase() : 'AC') === agency
      );

      const totalCount = agencyConsumers.length;
      const totalAmount = agencyConsumers.reduce((sum, c) => sum + (c.osd || 0), 0);

      const disconnectedList = agencyConsumers.filter((c) => c.status === 'disconnected');
      const disconnectedCount = disconnectedList.length;
      const disconnectedAmount = disconnectedList.reduce((sum, c) => sum + (c.osd || 0), 0);

      const paidList = agencyConsumers.filter((c) => c.status === 'paid');
      const paidCount = paidList.length;
      const paidAmount = paidList.reduce(
        (sum, c) => sum + (c.amountRealized || c.osd || 0),
        0
      );

      const officeTeamList = agencyConsumers.filter((c) => c.status === 'office_team');
      const officeTeamCount = officeTeamList.length;
      const officeTeamAmount = officeTeamList.reduce((sum, c) => sum + (c.osd || 0), 0);

      const disputeList = agencyConsumers.filter((c) => c.status === 'dispute');
      const disputeCount = disputeList.length;
      const disputeAmount = disputeList.reduce((sum, c) => sum + (c.osd || 0), 0);

      const notFoundList = agencyConsumers.filter((c) => c.status === 'not_found');
      const notFoundCount = notFoundList.length;
      const notFoundAmount = notFoundList.reduce((sum, c) => sum + (c.osd || 0), 0);

      const notAttendedList = agencyConsumers.filter(
        (c) => c.status === 'connected' || c.status === 'reissued'
      );
      const notAttendedCount = notAttendedList.length;
      const notAttendedAmount = notAttendedList.reduce((sum, c) => sum + (c.osd || 0), 0);

      // Performance %: Actioned/Resolved rate
      const performance =
        totalCount > 0 ? ((paidCount + disconnectedCount) / totalCount) * 100 : 0;

      return {
        agency,
        agencyDisplay: getAgencyDisplayName(agency),
        totalCount,
        totalAmount,
        disconnectedCount,
        disconnectedAmount,
        paidCount,
        paidAmount,
        officeTeamCount,
        officeTeamAmount,
        disputeCount,
        disputeAmount,
        notFoundCount,
        notFoundAmount,
        notAttendedCount,
        notAttendedAmount,
        performance,
      };
    });
  }, [consumers]);

  // Column totals across all agencies
  const matrixTotals = useMemo(() => {
    return agencyMatrix.reduce(
      (acc, r) => ({
        totalCount: acc.totalCount + r.totalCount,
        totalAmount: acc.totalAmount + r.totalAmount,
        disconnectedCount: acc.disconnectedCount + r.disconnectedCount,
        disconnectedAmount: acc.disconnectedAmount + r.disconnectedAmount,
        paidCount: acc.paidCount + r.paidCount,
        paidAmount: acc.paidAmount + r.paidAmount,
        officeTeamCount: acc.officeTeamCount + r.officeTeamCount,
        officeTeamAmount: acc.officeTeamAmount + r.officeTeamAmount,
        disputeCount: acc.disputeCount + r.disputeCount,
        disputeAmount: acc.disputeAmount + r.disputeAmount,
        notFoundCount: acc.notFoundCount + r.notFoundCount,
        notFoundAmount: acc.notFoundAmount + r.notFoundAmount,
        notAttendedCount: acc.notAttendedCount + r.notAttendedCount,
        notAttendedAmount: acc.notAttendedAmount + r.notAttendedAmount,
      }),
      {
        totalCount: 0,
        totalAmount: 0,
        disconnectedCount: 0,
        disconnectedAmount: 0,
        paidCount: 0,
        paidAmount: 0,
        officeTeamCount: 0,
        officeTeamAmount: 0,
        disputeCount: 0,
        disputeAmount: 0,
        notFoundCount: 0,
        notFoundAmount: 0,
        notAttendedCount: 0,
        notAttendedAmount: 0,
      }
    );
  }, [agencyMatrix]);

  const totalPerformance =
    matrixTotals.totalCount > 0
      ? ((matrixTotals.paidCount + matrixTotals.disconnectedCount) / matrixTotals.totalCount) * 100
      : 0;

  // Export Matrix to CSV
  const exportBreakdownCSV = () => {
    const headers = [
      'Agency',
      'Total Count',
      'Total Amount',
      'Disconnected Count',
      'Disconnected Amount',
      'Paid Count',
      'Paid Amount',
      'Office Team Count',
      'Office Team Amount',
      'Bill Dispute Count',
      'Bill Dispute Amount',
      'Not Found Count',
      'Not Found Amount',
      'Not Attended Count',
      'Not Attended Amount',
      'Performance (%)',
    ];

    const rows = agencyMatrix.map((r) => [
      `"${r.agencyDisplay}"`,
      r.totalCount,
      r.totalAmount,
      r.disconnectedCount,
      r.disconnectedAmount,
      r.paidCount,
      r.paidAmount,
      r.officeTeamCount,
      r.officeTeamAmount,
      r.disputeCount,
      r.disputeAmount,
      r.notFoundCount,
      r.notFoundAmount,
      r.notAttendedCount,
      r.notAttendedAmount,
      `${r.performance.toFixed(1)}%`,
    ]);

    rows.push([
      '"Total"',
      matrixTotals.totalCount,
      matrixTotals.totalAmount,
      matrixTotals.disconnectedCount,
      matrixTotals.disconnectedAmount,
      matrixTotals.paidCount,
      matrixTotals.paidAmount,
      matrixTotals.officeTeamCount,
      matrixTotals.officeTeamAmount,
      matrixTotals.disputeCount,
      matrixTotals.disputeAmount,
      matrixTotals.notFoundCount,
      matrixTotals.notFoundAmount,
      matrixTotals.notAttendedCount,
      matrixTotals.notAttendedAmount,
      `${totalPerformance.toFixed(1)}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Agency_Performance_Breakdown_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-4 transition-all">
      {/* Header bar with accordion toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-sm sm:text-base tracking-tight">
            {t.dashboardStats}
          </span>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            (Live Agency Performance Matrix)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 font-semibold hidden sm:inline">
            {isOpen ? 'Collapse' : 'Expand Matrix'}
          </span>
          <div className="p-1 rounded-full hover:bg-slate-200/70 text-slate-500">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
          {/* Dropdown Filters (Agency & Class) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t.agency}
              </label>
              <select
                value={selectedAgencyFilter}
                onChange={(e) => setSelectedAgencyFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {agencyList.map((a) => (
                  <option key={a} value={a}>
                    {a === 'All' ? t.all : `Agency ${a}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t.class}
              </label>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? t.all : `Class ${c}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Total */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.total}</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 tabular-nums">
                  {aggregates.totalCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.totalOsd)}
                </p>
              </div>
            </div>

            {/* Disconnected */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.disconnected}</span>
                <PowerOff className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600 tabular-nums">
                  {aggregates.disconnectedCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.disconnectedOsd)}
                </p>
              </div>
            </div>

            {/* Paid / Realized */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.paid}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600 tabular-nums">
                  {aggregates.paidCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.paidOsd)}
                </p>
              </div>
            </div>

            {/* Office Team */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.officeTeam}</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600 tabular-nums">
                  {aggregates.officeTeamCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.officeTeamOsd)}
                </p>
              </div>
            </div>

            {/* Bill Dispute */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.billDispute}</span>
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-orange-600 tabular-nums">
                  {aggregates.billDisputeCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.billDisputeOsd)}
                </p>
              </div>
            </div>

            {/* Not Found */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.notFound}</span>
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-700 tabular-nums">
                  {aggregates.notFoundCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.notFoundOsd)}
                </p>
              </div>
            </div>

            {/* Total Outstanding */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between md:col-span-2">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.totalOutstanding}</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-base sm:text-xl font-extrabold text-purple-700 tabular-nums truncate">
                  {formatINR(aggregates.totalOsd)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {statsConsumers.length} {t.consumersCount} in active scope
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* Agency Performance Breakdown Table (Exact layout from reference) */}
          {/* ============================================================== */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {/* Header bar of the breakdown table */}
            <div className="px-3 sm:px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Agency Performance Breakdown
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportBreakdownCSV}
                  title="Export Agency Breakdown Table as CSV"
                  className="flex items-center gap-1.5 text-slate-700 hover:text-blue-600 bg-white border border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* The Multi-Tier Table (Matching Reference Screenshot) */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200 min-w-[940px]">
                <thead>
                  {/* Top Level Category Headers */}
                  <tr className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200">
                    <th
                      rowSpan={2}
                      className="py-3 px-3.5 border-r border-slate-200 text-left align-middle font-semibold text-slate-600 text-xs tracking-tight bg-slate-50/90"
                    >
                      Agency
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Total
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Disconnected
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Paid
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Office Team
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Bill Dispute
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Not Found
                    </th>
                    <th
                      colSpan={2}
                      className="py-2.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-600 text-xs"
                    >
                      Not Attended
                    </th>
                    <th
                      rowSpan={2}
                      className="py-3 px-3.5 text-center align-middle font-semibold text-slate-600 text-xs tracking-tight bg-slate-50/90"
                    >
                      Performance
                    </th>
                  </tr>

                  {/* Subheaders: Count | Amount under each category */}
                  <tr className="bg-slate-50/50 text-slate-500 font-medium text-[11px] border-b border-slate-200">
                    {/* Under Total */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>

                    {/* Under Disconnected */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>

                    {/* Under Paid */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>

                    {/* Under Office Team */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>

                    {/* Under Bill Dispute */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>

                    {/* Under Not Found */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>

                    {/* Under Not Attended */}
                    <th className="py-1.5 px-2 border-r border-slate-200 text-center font-medium">Count</th>
                    <th className="py-1.5 px-2.5 border-r border-slate-200 text-right font-medium">Amount</th>
                  </tr>
                </thead>

                {/* Table Body Rows */}
                <tbody className="divide-y divide-slate-100 text-xs bg-white">
                  {agencyMatrix.map((row) => (
                    <tr
                      key={row.agency}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Agency Name */}
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-slate-200 text-left whitespace-nowrap">
                        {row.agencyDisplay}
                      </td>

                      {/* Total */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-semibold text-slate-800">
                        {row.totalCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.totalAmount)}
                      </td>

                      {/* Disconnected */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-medium text-slate-800">
                        {row.disconnectedCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.disconnectedAmount)}
                      </td>

                      {/* Paid */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-medium text-slate-800">
                        {row.paidCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.paidAmount)}
                      </td>

                      {/* Office Team */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-medium text-slate-800">
                        {row.officeTeamCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.officeTeamAmount)}
                      </td>

                      {/* Bill Dispute */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-medium text-slate-800">
                        {row.disputeCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.disputeAmount)}
                      </td>

                      {/* Not Found */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-medium text-slate-800">
                        {row.notFoundCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.notFoundAmount)}
                      </td>

                      {/* Not Attended */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 tabular-nums font-medium text-slate-800">
                        {row.notAttendedCount}
                      </td>
                      <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums font-medium text-slate-800 whitespace-nowrap">
                        {formatRupee(row.notAttendedAmount)}
                      </td>

                      {/* Performance (Rendered in bold red exactly like reference image) */}
                      <td
                        className={`py-2 px-3 text-center tabular-nums font-bold ${
                          row.performance >= 70
                            ? 'text-emerald-700'
                            : row.performance >= 40
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {row.performance.toFixed(1)}%
                      </td>
                    </tr>
                  ))}

                  {/* Summary / Total Row at Bottom */}
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td className="py-2.5 px-3.5 font-extrabold text-slate-900 border-r border-slate-200 text-left whitespace-nowrap">
                      Total
                    </td>

                    {/* Total */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.totalCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.totalAmount)}
                    </td>

                    {/* Disconnected */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.disconnectedCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.disconnectedAmount)}
                    </td>

                    {/* Paid */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.paidCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.paidAmount)}
                    </td>

                    {/* Office Team */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.officeTeamCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.officeTeamAmount)}
                    </td>

                    {/* Bill Dispute */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.disputeCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.disputeAmount)}
                    </td>

                    {/* Not Found */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.notFoundCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.notFoundAmount)}
                    </td>

                    {/* Not Attended */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 tabular-nums font-extrabold text-slate-900">
                      {matrixTotals.notAttendedCount}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 tabular-nums font-extrabold text-slate-900 whitespace-nowrap">
                      {formatRupee(matrixTotals.notAttendedAmount)}
                    </td>

                    {/* Overall Performance: light pink/red background with dark red text */}
                    <td className="py-2.5 px-3 text-center tabular-nums font-extrabold bg-red-50/50 text-red-700">
                      {totalPerformance.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
