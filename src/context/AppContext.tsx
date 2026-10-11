import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Consumer,
  User,
  SurveyLog,
  Language,
  GoogleSheetSyncConfig,
  ActiveView,
  ConsumerStatus,
  PriorityLevel,
  ThemeMode,
} from '../types';
import { initialUsers, initialConsumers, initialSurveyLogs } from '../data/initialData';
import { parseCSVToConsumers, pushUpdateToGoogleWebhook } from '../utils/sheetSync';
import { calculateDistanceKm } from '../utils/distance';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  consumers: Consumer[];
  visibleConsumers: Consumer[];
  surveyLogs: SurveyLog[];
  language: Language;
  activeView: ActiveView;
  syncConfig: GoogleSheetSyncConfig;
  userGeo: { lat: number; lng: number } | null;
  nearbyRadiusActive: boolean;
  searchQuery: string;
  selectedAgencyFilter: string;
  selectedClassFilter: string;
  selectedStatusFilter: string;
  minOsdFilter: number;
  toastMessage: string | null;
  theme: ThemeMode;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  login: (id: string, pass: string) => boolean;
  logout: () => void;
  toggleLanguage: () => void;
  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setSelectedAgencyFilter: (agency: string) => void;
  setSelectedClassFilter: (cls: string) => void;
  setSelectedStatusFilter: (status: string) => void;
  setMinOsdFilter: (val: number) => void;
  toggleNearbyLocator: () => void;
  showToast: (msg: string) => void;

  // Consumer Operations
  updateConsumerStatus: (
    consumerId: string,
    action: ConsumerStatus,
    data: {
      amountCollected?: number;
      remarks?: string;
      photoUrl?: string;
      priority?: PriorityLevel;
      assignAgency?: string;
      gps?: { lat: number; lng: number };
    }
  ) => Promise<boolean>;
  reissueConsumer: (consumerId: string, remarks?: string) => void;
  addConsumer: (consumer: Consumer) => void;
  editConsumer: (consumer: Consumer) => void;
  deleteConsumer: (consumerId: string) => void;
  importBulkConsumers: (newConsumers: Consumer[], mode?: 'upsert' | 'replace' | 'append') => number;
  bulkUpdateConsumers: (consumerIds: string[], updates: Partial<Consumer>) => number;
  clearAllConsumers?: () => void;

  // Admin User Management
  addUser: (user: User) => boolean;
  updateUser: (user: User) => boolean;
  deleteUser: (userId: string) => boolean;

  // Google Sheet Sync
  updateSyncConfig: (config: Partial<GoogleSheetSyncConfig>) => void;
  syncWithGoogleSheet: (url?: string) => Promise<boolean>;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'dc_app_current_user_v1';
const STORAGE_KEY_USERS = 'dc_app_users_v1';
const STORAGE_KEY_CONSUMERS = 'dc_app_consumers_v1';
const STORAGE_KEY_LOGS = 'dc_app_logs_v1';
const STORAGE_KEY_LANG = 'dc_app_lang_v1';
const STORAGE_KEY_SYNC = 'dc_app_sync_v1';
const STORAGE_KEY_THEME = 'dc_app_theme_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: defaults to 'official_white' (Screenshot 1-5 exact match)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved && ['official_white', 'electric_blue', 'night_shift', 'emerald_pro'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch (e) {
      console.error(e);
    }
    return 'official_white';
  });
  // 1. Current User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default to admin user for convenient instant preview
    return initialUsers[0];
  });

  // 2. Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialUsers;
  });

  // 3. Consumers state
  const [consumers, setConsumers] = useState<Consumer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONSUMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((c: Consumer) => c.id));
          const missing = initialConsumers.filter((c) => !ids.has(c.id));
          if (missing.length > 0) {
            return [...missing, ...parsed];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialConsumers;
  });

  // 4. Survey logs
  const [surveyLogs, setSurveyLogs] = useState<SurveyLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return initialSurveyLogs;
  });

  // 5. Language
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'bn' || saved === 'en') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'en';
  });

  // 6. Navigation and Filters
  const [activeView, setActiveView] = useState<ActiveView>('consumers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [minOsdFilter, setMinOsdFilter] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 7. Geolocation & Nearby locator
  const [userGeo, setUserGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadiusActive, setNearbyRadiusActive] = useState(false);

  // 8. Google Sheet Sync Config
  const [syncConfig, setSyncConfig] = useState<GoogleSheetSyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SYNC);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      sheetWebUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSampleLink/pub?output=csv',
      webhookUrl: '',
      lastSyncTime: null,
      autoSync: false,
      status: 'idle',
    };
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONSUMERS, JSON.stringify(consumers));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [consumers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(surveyLogs));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [surveyLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SYNC, JSON.stringify(syncConfig));
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [syncConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  }, [theme]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const login = (id: string, pass: string): boolean => {
    const trimmedId = id.trim().toLowerCase();
    const user = users.find(
      (u) => u.id.toLowerCase() === trimmedId && u.password === pass.trim()
    );
    if (user) {
      setCurrentUser(user);
      setActiveView('consumers');
      showToast(`Welcome ${user.name} (${user.role.toUpperCase()})`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveView('consumers');
    showToast('Logged out successfully');
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const toggleNearbyLocator = () => {
    if (nearbyRadiusActive) {
      setNearbyRadiusActive(false);
      showToast('Nearby filter disabled');
      return;
    }

    if (!navigator.geolocation) {
      // Default to Harishchandrapur coordinates if browser GPS disabled
      setUserGeo({ lat: 25.4328, lng: 87.8921 });
      setNearbyRadiusActive(true);
      showToast('Using Harishchandrapur CCC reference GPS (simulated)');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setNearbyRadiusActive(true);
        showToast('Sorting consumers by nearest GPS distance');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback to Harishchandrapur center
        setUserGeo({ lat: 25.4328, lng: 87.8921 });
        setNearbyRadiusActive(true);
        showToast('Location accessed (Harishchandrapur CCC sector)');
      },
      { timeout: 8000 }
    );
  };

  // Filtered consumers based on current user scope, agency, search and nearby
  const visibleConsumers = consumers
    .filter((c) => {
      // 1. User Scoping:
      // If current user is a regular field user, they ONLY see consumers belonging to their agency!
      if (currentUser && currentUser.role === 'user' && currentUser.agency !== 'ALL') {
        const cAgency = c.agency ? c.agency.toUpperCase() : '';
        const uAgency = currentUser.agency ? currentUser.agency.toUpperCase() : '';
        if (cAgency !== uAgency) {
          return false;
        }
      }

      // 2. Admin agency dropdown filter
      if (selectedAgencyFilter !== 'All') {
        const cAgency = c.agency ? c.agency.toUpperCase() : '';
        if (cAgency !== selectedAgencyFilter.toUpperCase()) {
          return false;
        }
      }

      // 3. Class filter
      if (selectedClassFilter !== 'All') {
        const cClass = c.class ? c.class.toUpperCase() : '';
        if (cClass !== selectedClassFilter.toUpperCase()) {
          return false;
        }
      }

      // 4. Status filter
      if (selectedStatusFilter !== 'All' && c.status !== selectedStatusFilter) {
        return false;
      }

      // 4b. Minimum OSD filter (like 3K, 5K or custom value marker)
      if (minOsdFilter > 0 && (Number(c.osd) || 0) < minOsdFilter) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (c.id && c.id.toLowerCase().includes(q)) ||
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (c.mru && c.mru.toLowerCase().includes(q)) ||
          (c.mobileNo && String(c.mobileNo).includes(q)) ||
          (c.meterNo && c.meterNo.toLowerCase().includes(q)) ||
          (c.agency && c.agency.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // If nearby filter is active, sort by distance to userGeo
      if (nearbyRadiusActive && userGeo) {
        const distA = calculateDistanceKm(userGeo.lat, userGeo.lng, a.lat, a.long);
        const distB = calculateDistanceKm(userGeo.lat, userGeo.lng, b.lat, b.long);
        return distA - distB;
      }
      // Prioritize urgent items first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      return 0;
    });

  // Consumer operations
  const updateConsumerStatus = async (
    consumerId: string,
    action: ConsumerStatus,
    data: {
      amountCollected?: number;
      remarks?: string;
      photoUrl?: string;
      priority?: PriorityLevel;
      assignAgency?: string;
      gps?: { lat: number; lng: number };
    }
  ): Promise<boolean> => {
    const target = consumers.find((c) => c.id === consumerId);
    if (!target) return false;

    const nowIso = new Date().toISOString();
    const updatedAmountRealized =
      action === 'paid' ? (data.amountCollected ?? target.osd) : (target.amountRealized || 0);

    const updated: Consumer = {
      ...target,
      status: action,
      amountRealized: updatedAmountRealized,
      priority: data.priority ?? target.priority,
      agency: data.assignAgency ?? target.agency,
      remarks: data.remarks ?? target.remarks,
      evidencePhoto: data.photoUrl ?? target.evidencePhoto,
      evidenceGps: data.gps ?? target.evidenceGps,
      evidenceTimestamp: nowIso,
      lastActionDate: nowIso.split('T')[0],
      lastActionBy: currentUser ? currentUser.id : 'agent',
    };

    setConsumers((prev) => prev.map((c) => (c.id === consumerId ? updated : c)));

    // Create survey log entry
    const newLog: SurveyLog = {
      id: `log-${Date.now()}`,
      consumerId: target.id,
      consumerName: target.name,
      agency: updated.agency,
      userId: currentUser ? currentUser.id : 'agent',
      action,
      amountRealized: updatedAmountRealized,
      remarks: data.remarks || '',
      photoUrl: data.photoUrl,
      timestamp: nowIso,
      lat: data.gps ? data.gps.lat : target.lat,
      long: data.gps ? data.gps.lng : target.long,
    };

    setSurveyLogs((prev) => [newLog, ...prev]);

    // Push update to Google Sheets Webhook if configured
    if (syncConfig.webhookUrl) {
      pushUpdateToGoogleWebhook(syncConfig.webhookUrl, newLog);
    }

    showToast(`Consumer ${target.id} updated to ${action.toUpperCase()}`);
    return true;
  };

  const reissueConsumer = (consumerId: string, remarks?: string) => {
    if (currentUser?.role !== 'admin') {
      showToast('Only administrator can reissue consumer surveys');
      return;
    }

    setConsumers((prev) =>
      prev.map((c) => {
        if (c.id === consumerId) {
          return {
            ...c,
            status: 'connected',
            priority: 'urgent',
            remarks: remarks || 'Reissued by Admin for re-verification',
            reissueCount: (c.reissueCount || 0) + 1,
            lastActionDate: new Date().toISOString().split('T')[0],
            lastActionBy: currentUser.id,
          };
        }
        return c;
      })
    );
    showToast(`Survey for Consumer #${consumerId} reissued for fresh field action`);
  };

  const addConsumer = (consumer: Consumer) => {
    setConsumers((prev) => [consumer, ...prev]);
    showToast(`Added consumer ${consumer.name}`);
  };

  const editConsumer = (consumer: Consumer) => {
    setConsumers((prev) => prev.map((c) => (c.id === consumer.id ? consumer : c)));
    showToast(`Updated consumer ${consumer.id}`);
  };

  const deleteConsumer = (consumerId: string) => {
    setConsumers((prev) => prev.filter((c) => c.id !== consumerId));
    showToast(`Deleted consumer ${consumerId}`);
  };

  const importBulkConsumers = (newConsumers: Consumer[], mode: 'upsert' | 'replace' | 'append' = 'upsert'): number => {
    if (!newConsumers || newConsumers.length === 0) return 0;

    if (mode === 'replace') {
      setConsumers(newConsumers);
      showToast(`Replaced master list with ${newConsumers.length} imported consumers`);
      return newConsumers.length;
    }

    if (mode === 'append') {
      setConsumers((prev) => [...newConsumers, ...prev]);
      showToast(`Added ${newConsumers.length} consumers to list`);
      return newConsumers.length;
    }

    // Default: 'upsert' - merge by consumer ID, preserving existing status/evidence if already updated
    let updatedCount = 0;
    let addedCount = 0;
    setConsumers((prev) => {
      const map = new Map<string, Consumer>();
      prev.forEach((c) => map.set(c.id, c));

      newConsumers.forEach((incoming) => {
        const existing = map.get(incoming.id);
        if (existing) {
          // Merge: retain user-collected survey status/evidence if present unless incoming explicitly specifies different
          map.set(incoming.id, {
            ...existing,
            ...incoming,
            // Keep completed actions if incoming is unvisited
            status: existing.status !== 'connected' && incoming.status === 'connected' ? existing.status : incoming.status,
            evidencePhoto: existing.evidencePhoto || incoming.evidencePhoto,
            amountRealized: existing.amountRealized ?? incoming.amountRealized,
            remarks: incoming.remarks || existing.remarks,
          });
          updatedCount++;
        } else {
          map.set(incoming.id, incoming);
          addedCount++;
        }
      });

      return Array.from(map.values());
    });

    showToast(`Bulk Import complete: ${addedCount} added, ${updatedCount} updated`);
    return addedCount + updatedCount;
  };

  const bulkUpdateConsumers = (consumerIds: string[], updates: Partial<Consumer>): number => {
    const idSet = new Set(consumerIds);
    let count = 0;
    setConsumers((prev) =>
      prev.map((c) => {
        if (idSet.has(c.id)) {
          count++;
          return {
            ...c,
            ...updates,
            lastActionDate: new Date().toISOString().split('T')[0],
            lastActionBy: currentUser ? currentUser.id : 'admin',
          };
        }
        return c;
      })
    );
    showToast(`Bulk edited ${count} consumers`);
    return count;
  };

  const clearAllConsumers = () => {
    setConsumers([]);
    showToast('Cleared all consumers from list');
  };

  // Admin User Management
  const addUser = (newUser: User): boolean => {
    if (users.some((u) => u.id.toLowerCase() === newUser.id.toLowerCase())) {
      showToast('User ID already exists!');
      return false;
    }
    setUsers((prev) => [...prev, newUser]);
    showToast(`Created user account for ${newUser.name}`);
    return true;
  };

  const updateUser = (updatedUser: User): boolean => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    showToast(`User ${updatedUser.id} updated`);
    return true;
  };

  const deleteUser = (userId: string): boolean => {
    if (userId === 'harishchandrapur') {
      showToast('Primary admin account cannot be deleted');
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    showToast(`User ${userId} deleted`);
    return true;
  };

  const updateSyncConfig = (cfg: Partial<GoogleSheetSyncConfig>) => {
    setSyncConfig((prev) => ({ ...prev, ...cfg }));
  };

  const syncWithGoogleSheet = async (url?: string): Promise<boolean> => {
    const targetUrl = url || syncConfig.sheetWebUrl;
    if (!targetUrl) {
      showToast('Please provide a valid Google Sheet CSV URL');
      return false;
    }

    setSyncConfig((prev) => ({ ...prev, status: 'syncing' }));

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const csvData = await response.text();
      const parsedConsumers = parseCSVToConsumers(csvData);

      if (parsedConsumers.length === 0) {
        throw new Error('No valid consumer rows detected in CSV');
      }

      setConsumers(parsedConsumers);
      const now = new Date().toLocaleString();
      setSyncConfig((prev) => ({
        ...prev,
        status: 'success',
        lastSyncTime: now,
      }));
      showToast(`Synced ${parsedConsumers.length} consumers from Google Sheet!`);
      return true;
    } catch (err: any) {
      console.error('Google Sheet Sync Error:', err);
      setSyncConfig((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Failed to fetch',
      }));
      showToast(`Sync failed: ${err.message || 'Check network / link'}`);
      return false;
    }
  };

  const resetToDefaultData = () => {
    setConsumers(initialConsumers);
    setUsers(initialUsers);
    setSurveyLogs(initialSurveyLogs);
    showToast('Reset to default Harishchandrapur office data');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        consumers,
        visibleConsumers,
        surveyLogs,
        language,
        activeView,
        syncConfig,
        userGeo,
        nearbyRadiusActive,
        searchQuery,
        selectedAgencyFilter,
        selectedClassFilter,
        selectedStatusFilter,
        minOsdFilter,
        toastMessage,
        theme,
        setTheme,

        login,
        logout,
        toggleLanguage,
        setActiveView,
        setSearchQuery,
        setSelectedAgencyFilter,
        setSelectedClassFilter,
        setSelectedStatusFilter,
        setMinOsdFilter,
        toggleNearbyLocator,
        showToast,

        updateConsumerStatus,
        reissueConsumer,
        addConsumer,
        editConsumer,
        deleteConsumer,
        importBulkConsumers,
        bulkUpdateConsumers,
        clearAllConsumers,

        addUser,
        updateUser,
        deleteUser,

        updateSyncConfig,
        syncWithGoogleSheet,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
