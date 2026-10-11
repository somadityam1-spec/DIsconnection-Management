import React from 'react';
import {
  Phone,
  MapPin,
  Calendar,
  Zap,
  Edit,
  RotateCcw,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
} from 'lucide-react';
import { Consumer } from '../types';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';
import { calculateDistanceKm, formatDistance } from '../utils/distance';

interface ConsumerCardProps {
  consumer: Consumer;
  onUpdate: (consumer: Consumer) => void;
  onReissue?: (consumerId: string) => void;
}

export const ConsumerCard: React.FC<ConsumerCardProps> = ({
  consumer,
  onUpdate,
  onReissue,
}) => {
  const { language, currentUser, userGeo, nearbyRadiusActive, reissueConsumer } = useApp();
  const t = translations[language];

  // Status badge styling
  const getStatusBadge = (status: Consumer['status']) => {
    switch (status) {
      case 'connected':
        return { label: 'connected', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'disconnected':
        return { label: 'disconnected', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'paid':
        return { label: 'paid', bg: 'bg-green-100 text-green-800 border-green-300 font-bold' };
      case 'dispute':
        return { label: 'dispute', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'office_team':
        return { label: 'office team', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'not_found':
        return { label: 'not found', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'reissued':
        return { label: 'reissued', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const statusStyle = getStatusBadge(consumer.status);

  // Proximity distance
  const distanceStr =
    nearbyRadiusActive && userGeo
      ? formatDistance(calculateDistanceKm(userGeo.lat, userGeo.lng, consumer.lat, consumer.long))
      : null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${consumer.lat},${consumer.long}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Urgent indicator stripe if priority is urgent */}
      {consumer.priority === 'urgent' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
      )}

      <div>
        {/* Top Tag Row: NEW, MRU, Status, Agency */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
              {t.newBadge}
            </span>
            <span className="bg-slate-100 text-slate-600 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-sm">
              {consumer.mru}
            </span>
            {distanceStr && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5" />
                {distanceStr}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${statusStyle.bg} capitalize`}
            >
              {statusStyle.label}
            </span>
            <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
              {consumer.agency}
            </span>
          </div>
        </div>

        {/* Consumer Name and ID */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
            {consumer.name}
          </h3>
          <div className="flex items-center justify-between mt-0.5 text-xs">
            <span className="text-slate-500 font-mono font-semibold">
              ID: {consumer.id}
            </span>

            {/* Direct Phone Call Button (tel: protocol) */}
            <a
              href={`tel:${consumer.mobileNo}`}
              title={`Call ${consumer.mobileNo}`}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-mono font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{consumer.mobileNo}</span>
            </a>
          </div>
        </div>

        {/* Address with MapPin */}
        <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3.5 leading-relaxed bg-slate-50/70 p-2 rounded-lg">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{consumer.address}</span>
        </div>

        {/* Two-Column Financial & Due Details Grid (Exact layout from Screenshot 1 & 5) */}
        <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-slate-100 mb-3 text-xs">
          {/* Outstanding Due */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              {t.outstanding}
            </div>
            <div className="text-base sm:text-lg font-black text-rose-600 font-mono tabular-nums leading-tight">
              {formatINR(consumer.osd)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {consumer.status === 'paid' ? 'Paid' : t.unpaid}
            </div>
          </div>

          {/* Issue Date & Due Range */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              {t.issueDate}
            </div>
            <div className="flex items-center gap-1 font-mono font-semibold text-slate-800 text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>{consumer.issuedDate}</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate" title={consumer.dueDate}>
              {consumer.dueDate ? `Due: ${consumer.dueDate}` : 'Due: 30 days'}
            </div>
          </div>
        </div>

        {/* Class & Meter Number strip */}
        <div className="flex items-center justify-between text-xs text-slate-600 mb-3 px-1">
          <div>
            <span className="text-slate-400">{t.class}: </span>
            <span className="font-bold text-slate-800">{consumer.class}</span>
          </div>
          <div>
            <span className="text-slate-400">{t.meter}: </span>
            <span className="font-mono font-semibold text-slate-800">{consumer.meterNo}</span>
          </div>
        </div>

        {/* Evidence Photo thumbnail if taken */}
        {consumer.evidencePhoto && (
          <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">Watermarked Evidence Saved</span>
            </div>
            <img
              src={consumer.evidencePhoto}
              alt="Watermarked Evidence"
              className="w-12 h-8 object-cover rounded border border-slate-300"
            />
          </div>
        )}

        {/* Remarks / Notes if any */}
        {consumer.remarks && (
          <div className="mb-3 text-[11px] bg-amber-50 text-amber-900 p-2 rounded border border-amber-200 italic">
            "{consumer.remarks}"
          </div>
        )}
      </div>

      {/* Action Strip: Live Navigation link + Update Status CTA */}
      <div>
        <div className="flex items-center justify-between text-xs text-blue-600 mb-2 px-1">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline font-semibold cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.live} Navigation</span>
          </a>

          <button
            onClick={() => onUpdate(consumer)}
            className="hover:underline text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
          >
            {t.details}
          </button>
        </div>

        {/* Primary Action Button: Update Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(consumer)}
            className="flex-1 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>{t.updateStatus}</span>
          </button>

          {/* Admin Reissue button */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onReissue ? onReissue(consumer.id) : reissueConsumer(consumer.id)}
              title="Admin Reissue Survey for Field Visit"
              className="min-h-[44px] px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
