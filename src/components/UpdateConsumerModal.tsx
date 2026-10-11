import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  History,
  PowerOff,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Camera,
  Upload,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { Consumer, ConsumerStatus, PriorityLevel } from '../types';
import { useApp } from '../context/AppContext';
import { translations, formatINR } from '../utils/translations';
import { watermarkImage } from '../utils/watermark';

interface UpdateConsumerModalProps {
  consumer: Consumer;
  onClose: () => void;
}

export const UpdateConsumerModal: React.FC<UpdateConsumerModalProps> = ({
  consumer,
  onClose,
}) => {
  const { language, currentUser, updateConsumerStatus, showToast, userGeo } = useApp();
  const t = translations[language];

  // Form State
  const [selectedStatus, setSelectedStatus] = useState<ConsumerStatus>(consumer.status);
  const [priority, setPriority] = useState<PriorityLevel>(consumer.priority || 'normal');
  const [assignedAgency, setAssignedAgency] = useState(consumer.agency || 'AC');
  const [amountCollected, setAmountCollected] = useState<number>(consumer.amountRealized || consumer.osd);
  const [remarks, setRemarks] = useState(consumer.remarks || '');
  const [watermarkedPhoto, setWatermarkedPhoto] = useState<string | null>(consumer.evidencePhoto || null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Video / Canvas refs for live camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Agency options
  const agencyOptions = ['AC', 'CM', 'MR', 'JG', 'MZ', 'SA', 'RK', 'HB', 'ER'];

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      showToast('Camera permission denied or camera unavailable. Please use gallery upload.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      setIsProcessingPhoto(true);
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        // Stamp tamper-evident watermark
        const stamped = await watermarkImage(dataUrl, {
          consumerId: consumer.id,
          consumerName: consumer.name,
          mru: consumer.mru,
          agency: assignedAgency,
          action: selectedStatus,
          userId: currentUser?.id || 'SURVEYOR',
          lat: userGeo?.lat || consumer.lat,
          lng: userGeo?.lng || consumer.long,
        });

        setWatermarkedPhoto(stamped);
        showToast('Photo captured with GPS & timestamp watermark');
      }
    } catch (err) {
      console.error('Snapshot error:', err);
      showToast('Failed to process photo');
    } finally {
      setIsProcessingPhoto(false);
      stopCamera();
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const stamped = await watermarkImage(file, {
        consumerId: consumer.id,
        consumerName: consumer.name,
        mru: consumer.mru,
        agency: assignedAgency,
        action: selectedStatus,
        userId: currentUser?.id || 'SURVEYOR',
        lat: userGeo?.lat || consumer.lat,
        lng: userGeo?.lng || consumer.long,
      });

      setWatermarkedPhoto(stamped);
      showToast('Photo uploaded and auto-watermarked with GPS coordinates');
    } catch (err) {
      console.error('Gallery watermark error:', err);
      showToast('Failed to watermark uploaded photo');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateConsumerStatus(consumer.id, selectedStatus, {
        amountCollected: selectedStatus === 'paid' ? Number(amountCollected) : 0,
        remarks,
        photoUrl: watermarkedPhoto || undefined,
        priority,
        assignAgency: assignedAgency,
        gps: userGeo || { lat: consumer.lat, lng: consumer.long },
      });
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error saving update');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status buttons definition (matching Screenshot 3)
  const statusOptions: {
    status: ConsumerStatus;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      status: 'disconnected',
      label: 'DISCONNECT',
      icon: <PowerOff className="w-5 h-5" />,
      color: 'hover:border-red-500 hover:text-red-700 text-slate-700',
    },
    {
      status: 'dispute',
      label: 'DISPUTE',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'hover:border-amber-500 hover:text-amber-700 text-slate-700',
    },
    {
      status: 'office_team',
      label: 'OFFICE TEAM',
      icon: <Clock className="w-5 h-5" />,
      color: 'hover:border-purple-500 hover:text-purple-700 text-slate-700',
    },
    {
      status: 'paid',
      label: 'PAID',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'hover:border-emerald-500 hover:text-emerald-700 text-slate-700',
    },
    {
      status: 'not_found',
      label: 'NOT FOUND',
      icon: <XCircle className="w-5 h-5" />,
      color: 'hover:border-slate-500 hover:text-slate-800 text-slate-700',
    },
    {
      status: 'reissued',
      label: 'REISSUE',
      icon: <RotateCcw className="w-5 h-5" />,
      color: 'hover:border-indigo-500 hover:text-indigo-700 text-slate-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in-50 zoom-in-95">
        {/* Top Header bar with Back button and History icon */}
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-bold text-sm cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t.updateConsumer}</span>
          </button>

          <button
            onClick={() => {
              if (consumer.remarks || consumer.lastActionDate) {
                alert(
                  `Survey History:\nLast Action: ${consumer.status.toUpperCase()}\nBy: ${
                    consumer.lastActionBy || 'Admin'
                  }\nDate: ${consumer.lastActionDate || 'N/A'}\nRemarks: ${consumer.remarks || 'None'}`
                );
              } else {
                showToast('No previous action records found for this consumer');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>{t.history}</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Consumer Summary Card (Screenshot 3 top card) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {consumer.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{consumer.address}</span>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-lg sm:text-xl font-black text-rose-600 font-mono tabular-nums">
                  {formatINR(consumer.osd)}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t.outstanding}
                </span>
              </div>
            </div>

            {/* Micro Metadata Grid (Screenshot 3) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 mt-3 border-t border-slate-200 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  {t.consumerId}
                </span>
                <span className="font-mono font-bold text-slate-800">{consumer.id}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  {t.mruSection}
                </span>
                <span className="font-mono font-bold text-slate-800">{consumer.mru}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  {t.baseClass}
                </span>
                <span className="font-bold text-slate-800">{consumer.class}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  {t.deviceType}
                </span>
                <span className="font-mono font-semibold text-slate-800">{consumer.meterNo}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  {t.mobileNumber}
                </span>
                <span className="font-mono font-semibold text-slate-800">{consumer.mobileNo}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                  {t.dueDateRange}
                </span>
                <span className="font-mono text-slate-700 text-[11px] truncate block">
                  {consumer.dueDate || `${consumer.issuedDate}-10.08.2026`}
                </span>
              </div>
            </div>
          </div>

          {/* SET STATUS Grid (Screenshot 3 6-button grid) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              {t.setStatus}
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.status;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setSelectedStatus(opt.status)}
                    className={`min-h-[50px] p-3 rounded-xl border flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-2 ring-purple-200'
                        : `border-slate-200 bg-white ${opt.color}`
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Status is PAID: Amount Collected field */}
          {selectedStatus === 'paid' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1">
              <label className="block text-xs font-bold text-emerald-900">
                {t.amountCollected}
              </label>
              <input
                type="number"
                step="0.01"
                value={amountCollected}
                onChange={(e) => setAmountCollected(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-emerald-700">
                Defaulted to total outstanding due ₹{consumer.osd}. Adjust if partial settlement.
              </p>
            </div>
          )}

          {/* ASSIGN AGENCY & PRIORITY Row (Screenshot 3) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.assignAgency}
              </label>
              <select
                value={assignedAgency}
                onChange={(e) => setAssignedAgency(e.target.value)}
                disabled={currentUser?.role !== 'admin'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {agencyOptions.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t.priority}
              </label>
              <button
                type="button"
                onClick={() => setPriority(priority === 'urgent' ? 'normal' : 'urgent')}
                className={`w-full py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  priority === 'urgent'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t.markAsUrgent}</span>
              </button>
            </div>
          </div>

          {/* EVIDENCE (AUTO-WATERMARKED) (Screenshot 3) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.evidenceWatermark}
              </label>
              <span className="text-[11px] text-blue-600 font-medium">GPS Auto-Burn</span>
            </div>

            {/* Live Camera Stream if active */}
            {isCameraActive && (
              <div className="mb-3 rounded-xl overflow-hidden bg-black relative border-2 border-blue-500">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-56 sm:h-72 object-cover"
                />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={captureCameraSnapshot}
                    disabled={isProcessingPhoto}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-full shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Snapshot & Watermark</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-slate-800 text-white text-xs py-2 px-3 rounded-full hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Two Camera Action Buttons: Camera (Live) & Gallery */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={startCamera}
                disabled={isProcessingPhoto}
                className="min-h-[46px] border border-slate-200 bg-white hover:bg-slate-50 rounded-xl p-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{t.cameraLive}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="min-h-[46px] border border-slate-200 bg-white hover:bg-slate-50 rounded-xl p-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>{t.gallery}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryUpload}
                className="hidden"
              />
            </div>

            {/* Watermark Processing Spinner */}
            {isProcessingPhoto && (
              <div className="mt-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-blue-600" />
                <span>Generating official tamper-evident GPS watermark...</span>
              </div>
            )}

            {/* Watermarked Photo Preview */}
            {watermarkedPhoto && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                <img
                  src={watermarkedPhoto}
                  alt="Watermarked Evidence"
                  className="w-full max-h-64 object-contain bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setWatermarkedPhoto(null)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs shadow-md cursor-pointer"
                  title="Remove Photo"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <div className="p-2 bg-slate-900 text-emerald-400 text-[11px] font-mono flex items-center justify-between">
                  <span>✓ Stamped with GPS, Time & Consumer Seal</span>
                  <a
                    href={watermarkedPhoto}
                    download={`Evidence_${consumer.id}.jpg`}
                    className="text-blue-300 underline font-sans text-xs"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Remarks & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {t.remarks}
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter survey findings, dispute reasons, or lineman remarks..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modal Footer (Cancel & Save Update - Screenshot 3) */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{t.saveUpdate}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
