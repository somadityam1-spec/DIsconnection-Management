import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Users,
  PowerOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  DollarSign,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';
import { Consumer } from '../types';

export const StatsBreakdown: React.FC = () => {
  const {
    consumers,
    language,
    selectedAgencyFilter,
    setSelectedAgencyFilter,
    selectedClassFilter,
    setSelectedClassFilter,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language];

  // Distinct agencies and classes
  const agencyList = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach((c) => {
      if (c.agency) set.add(c.agency.toUpperCase());
    });
    return ['All', ...Array.from(set).sort()];
  }, [consumers]);

  const classList = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach((c) => {
      if (c.class) set.add(c.class.toUpperCase());
    });
    return ['All', ...Array.from(set).sort()];
  }, [consumers]);

  // Filtered consumers for the top metrics cards
  const statsConsumers = useMemo(() => {
    return consumers.filter((c) => {
      if (selectedAgencyFilter !== 'All') {
        const ag = c.agency ? c.agency.toUpperCase() : '';
        if (ag !== selectedAgencyFilter.toUpperCase()) return false;
      }
      if (selectedClassFilter !== 'All') {
        const cls = c.class ? c.class.toUpperCase() : '';
        if (cls !== selectedClassFilter.toUpperCase()) return false;
      }
      return true;
    });
  }, [consumers, selectedAgencyFilter, selectedClassFilter]);

  // Aggregate numbers
  const aggregates = useMemo(() => {
    const res = {
      totalCount: statsConsumers.length,
      totalOsd: statsConsumers.reduce((sum, c) => sum + c.osd, 0),
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
          res.connectedOsd += c.osd;
          break;
        case 'disconnected':
          res.disconnectedCount++;
          res.disconnectedOsd += c.osd;
          break;
        case 'paid':
          res.paidCount++;
          res.paidOsd += c.amountRealized || c.osd;
          break;
        case 'office_team':
          res.officeTeamCount++;
          res.officeTeamOsd += c.osd;
          break;
        case 'dispute':
          res.billDisputeCount++;
          res.billDisputeOsd += c.osd;
          break;
        case 'not_found':
          res.notFoundCount++;
          res.notFoundOsd += c.osd;
          break;
      }
    });

    return res;
  }, [statsConsumers]);

  // Cross-agency performance matrix (Screenshot 2 bottom table)
  const agencyMatrix = useMemo(() => {
    const agencies = Array.from(
      new Set(consumers.map((c) => (c.agency ? c.agency.toUpperCase() : 'AC')))
    ).sort();
    return agencies.map((agency) => {
      const agencyConsumers = consumers.filter(
        (c) => (c.agency ? c.agency.toUpperCase() : 'AC') === agency
      );
      const row = {
        agency,
        officeTeamCount: agencyConsumers.filter((c) => c.status === 'office_team').length,
        officeTeamAmount: agencyConsumers
          .filter((c) => c.status === 'office_team')
          .reduce((sum, c) => sum + c.osd, 0),
        disputeCount: agencyConsumers.filter((c) => c.status === 'dispute').length,
        disputeAmount: agencyConsumers
          .filter((c) => c.status === 'dispute')
          .reduce((sum, c) => sum + c.osd, 0),
        notFoundCount: agencyConsumers.filter((c) => c.status === 'not_found').length,
        notFoundAmount: agencyConsumers
          .filter((c) => c.status === 'not_found')
          .reduce((sum, c) => sum + c.osd, 0),
        notAttendedCount: agencyConsumers.filter((c) => c.status === 'connected' || c.status === 'reissued').length,
        notAttendedAmount: agencyConsumers
          .filter((c) => c.status === 'connected' || c.status === 'reissued')
          .reduce((sum, c) => sum + c.osd, 0),
        totalCount: agencyConsumers.length,
        totalAmount: agencyConsumers.reduce((sum, c) => sum + c.osd, 0),
      };
      return row;
    });
  }, [consumers]);

  const matrixTotals = useMemo(() => {
    return agencyMatrix.reduce(
      (acc, r) => ({
        officeTeamCount: acc.officeTeamCount + r.officeTeamCount,
        officeTeamAmount: acc.officeTeamAmount + r.officeTeamAmount,
        disputeCount: acc.disputeCount + r.disputeCount,
        disputeAmount: acc.disputeAmount + r.disputeAmount,
        notFoundCount: acc.notFoundCount + r.notFoundCount,
        notFoundAmount: acc.notFoundAmount + r.notFoundAmount,
        notAttendedCount: acc.notAttendedCount + r.notAttendedCount,
        notAttendedAmount: acc.notAttendedAmount + r.notAttendedAmount,
        totalCount: acc.totalCount + r.totalCount,
        totalAmount: acc.totalAmount + r.totalAmount,
      }),
      {
        officeTeamCount: 0,
        officeTeamAmount: 0,
        disputeCount: 0,
        disputeAmount: 0,
        notFoundCount: 0,
        notFoundAmount: 0,
        notAttendedCount: 0,
        notAttendedAmount: 0,
        totalCount: 0,
        totalAmount: 0,
      }
    );
  }, [agencyMatrix]);

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
        </div>
        <div className="p-1 rounded-full hover:bg-slate-200/70 text-slate-500">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/60">
          {/* Dropdown Filters (Agency & Class) as in Screenshot 2 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
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

          {/* KPI Stat Cards Grid (2 columns on mobile, 4 on desktop, matching Screenshot 2) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
            {/* Total */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.total}</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {aggregates.totalCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.totalOsd)}
                </p>
              </div>
            </div>

            {/* Connected / Unattended */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.connected}</span>
                <Radio className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {aggregates.connectedCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.connectedOsd)}
                </p>
              </div>
            </div>

            {/* Disconnected */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.disconnected}</span>
                <PowerOff className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-rose-600 tabular-nums">
                  {aggregates.disconnectedCount}
                </p>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {formatINR(aggregates.disconnectedOsd)}
                </p>
              </div>
            </div>

            {/* Paid */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.paid}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-600 tabular-nums">
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
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">{t.totalOutstanding}</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-bold text-purple-700 tabular-nums truncate">
                  {formatINR(aggregates.totalOsd)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {statsConsumers.length} {t.consumersCount}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Agency Table Breakdown (Screenshot 2 bottom table) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>Agency Performance Breakdown</span>
              <span className="text-[10px] text-slate-500">Live Office Matrix</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2 px-3 font-semibold">Agency</th>
                    <th className="py-2 px-2 text-right font-semibold">Office Team (₹ / Ct)</th>
                    <th className="py-2 px-2 text-right font-semibold">Dispute (₹ / Ct)</th>
                    <th className="py-2 px-2 text-right font-semibold">Not Found (₹ / Ct)</th>
                    <th className="py-2 px-2 text-right font-semibold">Not Attended (₹ / Ct)</th>
                    <th className="py-2 px-3 text-right font-bold text-slate-800">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {agencyMatrix.map((row) => (
                    <tr key={row.agency} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-2 px-3 font-bold text-blue-700 font-sans">
                        {row.agency}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span>{formatINR(row.officeTeamAmount)}</span>
                        <span className="text-slate-400 ml-1">({row.officeTeamCount})</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span>{formatINR(row.disputeAmount)}</span>
                        <span className="text-slate-400 ml-1">({row.disputeCount})</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span>{formatINR(row.notFoundAmount)}</span>
                        <span className="text-slate-400 ml-1">({row.notFoundCount})</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span>{formatINR(row.notAttendedAmount)}</span>
                        <span className="text-slate-400 ml-1">({row.notAttendedCount})</span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {formatINR(row.totalAmount)}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td className="py-2.5 px-3 font-sans">Total</td>
                    <td className="py-2.5 px-2 text-right">
                      {formatINR(matrixTotals.officeTeamAmount)} ({matrixTotals.officeTeamCount})
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {formatINR(matrixTotals.disputeAmount)} ({matrixTotals.disputeCount})
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {formatINR(matrixTotals.notFoundAmount)} ({matrixTotals.notFoundCount})
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {formatINR(matrixTotals.notAttendedAmount)} ({matrixTotals.notAttendedCount})
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-900 font-bold">
                      {formatINR(matrixTotals.totalAmount)}
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
