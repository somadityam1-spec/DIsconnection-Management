export type ConsumerStatus =
  | 'connected'
  | 'disconnected'
  | 'paid'
  | 'dispute'
  | 'office_team'
  | 'not_found'
  | 'reissued';

export type PriorityLevel = 'normal' | 'urgent';

export interface Consumer {
  id: string; // Consumer ID e.g. 342092397
  name: string;
  address: string;
  class: string; // 'A' | 'B' | 'C' | 'D' | 'Commercial' etc.
  osd: number; // Outstanding Dues (₹)
  mru: string; // MRU section e.g. 9QS66MMR
  mobileNo: string;
  lat: number;
  long: number;
  meterNo: string;
  agency: string; // e.g. 'AC', 'CM', 'MR', 'JG', 'MZ', 'SA', 'RK', 'HB', 'ER'
  issuedDate: string; // e.g. 07.03.2025
  dueDate?: string; // e.g. 07.03.2025-10.08.2026
  status: ConsumerStatus;
  priority: PriorityLevel;
  amountRealized?: number; // Amount collected
  lastActionDate?: string;
  lastActionBy?: string;
  evidencePhoto?: string; // Data URL of watermarked evidence
  evidenceGps?: { lat: number; lng: number };
  evidenceTimestamp?: string;
  remarks?: string;
  reissueCount?: number;
}

export interface User {
  id: string; // Username e.g. harishchandrapur, agency_ac
  name: string;
  password: string;
  role: 'admin' | 'user';
  agency: string; // e.g. 'AC', 'CM', or 'ALL' for admin
  phone?: string;
  createdAt: string;
}

export interface SurveyLog {
  id: string;
  consumerId: string;
  consumerName: string;
  agency: string;
  userId: string;
  action: ConsumerStatus;
  amountRealized: number;
  remarks: string;
  photoUrl?: string;
  timestamp: string;
  lat: number;
  long: number;
}

export type Language = 'en' | 'bn';

export type ThemeMode = 'official_white' | 'electric_blue' | 'night_shift' | 'emerald_pro';

export interface GoogleSheetSyncConfig {
  sheetWebUrl: string; // Public CSV / Web publish link
  webhookUrl: string; // Google Apps Script Webhook endpoint
  lastSyncTime: string | null;
  autoSync: boolean;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export type ActiveView =
  | 'consumers'
  | 'analytics'
  | 'rankings'
  | 'admin_users'
  | 'admin_consumers'
  | 'meeting_report'
  | 'sheet_sync'
  | 'history_logs';
