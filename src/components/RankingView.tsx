import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Percent,
  CheckCircle2,
  PowerOff,
  Users,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';

export const RankingView: React.FC = () => {
  const { consumers, users, language, setActiveView } = useApp();
  const t = translations[language];

  const [selectedClass, setSelectedClass] = useState<string>('All');

  const classes = ['All', 'A', 'B', 'C', 'D'];

  // Calculate ranking metrics per agency/surveyor
  const rankings = useMemo(() => {
    // Filter consumers by selected class
    const classFiltered = selectedClass === 'All'
      ? consumers
      : consumers.filter((c) => c.class.toUpperCase() === selectedClass.toUpperCase());

    // Group by agency
    const agencyGroups: Record<string, typeof classFiltered> = {};
    classFiltered.forEach((c) => {
      const ag = c.agency.toUpperCase();
      if (!agencyGroups[ag]) agencyGroups[ag] = [];
      agencyGroups[ag].push(c);
    });

    const list = Object.entries(agencyGroups).map(([agency, list]) => {
      const assignedOsd = list.reduce((sum, c) => sum + c.osd, 0);
      const realizedOsd = list.reduce((sum, c) => {
        if (c.status === 'paid') return sum + (c.amountRealized || c.osd);
        return sum;
      }, 0);

      const disconnectedCount = list.filter((c) => c.status === 'disconnected').length;
      const paidCount = list.filter((c) => c.status === 'paid').length;
      const attendedCount = list.filter((c) => c.status !== 'connected' && c.status !== 'reissued').length;
      const totalCount = list.length;

      // Realization Rate (% of assigned OSD recovered)
      const realizationRate = assignedOsd > 0 ? (realizedOsd / assignedOsd) * 100 : 0;
      
      // Passion Score formula: 70% realization rate weight + 30% attendance coverage weight
      const attendanceRate = totalCount > 0 ? (attendedCount / totalCount) * 100 : 0;
      const passionScore = Math.round(realizationRate * 0.7 + attendanceRate * 0.3);

      // Corresponding user if created
      const matchedUser = users.find((u) => u.agency.toUpperCase() === agency);

      return {
        agency,
        agentName: matchedUser ? matchedUser.name : `Agency ${agency} Lineman Team`,
        assignedOsd,
        realizedOsd,
        realizationRate,
        attendanceRate,
        passionScore,
        totalCount,
        paidCount,
        disconnectedCount,
        attendedCount,
      };
    });

    // Rank primarily by Realized OSD Percentage, then by Realized Amount
    return list.sort((a, b) => {
      if (b.realizationRate !== a.realizationRate) {
        return b.realizationRate - a.realizationRate;
      }
      return b.realizedOsd - a.realizedOsd;
    });
  }, [consumers, users, selectedClass]);

  const top3 = rankings.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
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
              <Trophy className="w-6 h-6 text-amber-500" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.passionRankings}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Ranked by OSD Realization Rate (Realized ₹ vs Assigned ₹) and Field Actions
            </p>
          </div>
        </div>

        {/* Class Selection Filter (As requested by user: "User and admin can select class wish action and ranking") */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Class:
          </span>
          <div className="flex items-center gap-1">
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Podium for Top 3 Performers */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-end">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col items-center text-center order-2 sm:order-1">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-lg mb-2 border-2 border-slate-300">
                🥈 2nd
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">{top3[1].agentName}</h3>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md my-1">
                Agency {top3[1].agency}
              </span>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono tabular-nums">
                {top3[1].realizationRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {formatINR(top3[1].realizedOsd)} of {formatINR(top3[1].assignedOsd)}
              </p>
            </div>
          )}

          {/* 1st Place Champion */}
          {top3[0] && (
            <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-300 p-5 sm:p-6 shadow-md flex flex-col items-center text-center order-1 sm:order-2 transform sm:-translate-y-2">
              <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xl mb-2 shadow-sm">
                👑 1st
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full mb-1">
                Top Recovery Leader
              </div>
              <h3 className="font-black text-slate-900 text-lg">{top3[0].agentName}</h3>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md my-1 border border-amber-200">
                Agency {top3[0].agency}
              </span>
              <div className="mt-2 text-3xl font-black text-emerald-600 font-mono tabular-nums">
                {top3[0].realizationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-600 font-mono font-semibold">
                Recovered {formatINR(top3[0].realizedOsd)}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span>{top3[0].paidCount} Paid</span>
                <span>·</span>
                <span>{top3[0].disconnectedCount} Disconnected</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col items-center text-center order-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-lg mb-2 border-2 border-amber-200">
                🥉 3rd
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">{top3[2].agentName}</h3>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md my-1">
                Agency {top3[2].agency}
              </span>
              <div className="mt-2 text-2xl font-black text-slate-900 font-mono tabular-nums">
                {top3[2].realizationRate.toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {formatINR(top3[2].realizedOsd)} of {formatINR(top3[2].assignedOsd)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Full Rankings Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Comprehensive Performance Matrix</h2>
          </div>
          <span className="text-xs text-slate-500">Class: {selectedClass}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Agency / Surveyor</th>
                <th className="py-3 px-4 text-right">Assigned OSD (₹)</th>
                <th className="py-3 px-4 text-right">Realized OSD (₹)</th>
                <th className="py-3 px-4 text-right">Realization Rate</th>
                <th className="py-3 px-4 text-right">Coverage</th>
                <th className="py-3 px-4 text-center">Actions (Paid / DC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {rankings.map((r, idx) => (
                <tr key={r.agency} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <span className="w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-extrabold text-slate-900">{r.agency}</div>
                    <div className="text-[11px] text-slate-500">{r.agentName}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-700">
                    {formatINR(r.assignedOsd)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                    {formatINR(r.realizedOsd)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-black text-sm px-2 py-0.5 rounded ${
                        r.realizationRate >= 50
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.realizationRate >= 20
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.realizationRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600">
                    {r.attendedCount} / {r.totalCount} ({r.attendanceRate.toFixed(0)}%)
                  </td>
                  <td className="py-3.5 px-4 text-center font-sans">
                    <span className="text-emerald-700 font-bold">{r.paidCount} Paid</span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span className="text-red-700 font-bold">{r.disconnectedCount} DC</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
