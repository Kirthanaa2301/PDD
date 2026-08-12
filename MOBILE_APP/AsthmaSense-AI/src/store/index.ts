import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

interface StoreHook<T> {
  <U>(selector: (state: T) => U): U;
  getState: () => T;
  setState: (nextState: Partial<T> | ((s: T) => Partial<T>)) => void;
}

// Simple lightweight state store generator mimicking Zustand
function createStore<T>(initialState: T, persistKey?: string): StoreHook<T> {
  // Extract actions (functions) from initialState to ensure they are never overwritten or lost
  const actions: any = {};
  const data: any = {};
  for (const key of Object.keys(initialState as any)) {
    if (typeof (initialState as any)[key] === 'function') {
      actions[key] = (initialState as any)[key];
    } else {
      data[key] = (initialState as any)[key];
    }
  }

  // Track hydration state if persisted
  let state = { ...data, ...actions, _hydrated: !persistKey } as any;
  const listeners = new Set<(state: T) => void>();

  // Load from AsyncStorage if key is provided
  if (persistKey) {
    AsyncStorage.getItem(persistKey).then((val) => {
      let parsed: any = {};
      if (val) {
        try {
          parsed = JSON.parse(val);
          // Auto-heal legacy manual array formats to standard store object structure
          if (Array.isArray(parsed)) {
            parsed = { sessions: parsed };
          }
        } catch (e) {
          console.warn('Failed to parse persistent store', persistKey, e);
        }
      }
      state = { ...state, ...parsed, ...actions, _hydrated: true };
      listeners.forEach((listener) => listener(state));
    }).catch(() => {
      state = { ...state, _hydrated: true };
      listeners.forEach((listener) => listener(state));
    });
  }

  const getState = () => state;
  const setState = (nextState: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof nextState === 'function' ? nextState(state) : nextState;
    // Always preserve actions when setting next state
    state = { ...state, ...next, ...actions };
    listeners.forEach((listener) => listener(state));
    if (persistKey) {
      // JSON.stringify will automatically omit functions
      AsyncStorage.setItem(persistKey, JSON.stringify(state)).catch(() => {});
    }
  };

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = <U>(selector: (state: T) => U): U => {
    const selectorRef = useRef(selector);
    selectorRef.current = selector;

    const [slice, setSlice] = useState(() => selector(state));

    useEffect(() => {
      const unsubscribe = subscribe((nextState) => {
        const nextSlice = selectorRef.current(nextState);
        setSlice((prev) => {
          if (prev === nextSlice) return prev;
          return nextSlice;
        });
      });
      return () => {
        unsubscribe();
      };
    }, []);

    return slice;
  };

  // Attach state methods to the hook function
  const storeHook = useStore as any;
  storeHook.getState = getState;
  storeHook.setState = setState;

  return storeHook;
}

// ─── AUTH STORE ──────────────────────────────────────────────────────────────

export interface UserProfile {
  age?: number;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  triggers?: string[];
  inhaler?: string;
  frequency?: string;
  emergencyContact?: string;
  hasCompletedOnboarding?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profile?: UserProfile;
  hasCompletedOnboarding?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  streak: number;
  lastLoginDate: string | null;
  loginDates: string[];
  isSyncing: boolean;
  login: (email: string) => void;
  logout: () => void;
  checkLoginStreak: () => void;
}

export const useAuthStore = createStore<AuthState>(
  {
    user: null,
    token: null,
    streak: 0,
    lastLoginDate: null,
    loginDates: [],
    isSyncing: false,
    login: (email: string) => {
      const name = email.split('@')[0] || 'User';
      useAuthStore.setState({ user: { id: 'demo-id', name, email, hasCompletedOnboarding: true }, token: 'demo-token' });
      useAuthStore.getState().checkLoginStreak();
    },
    logout: () => {
      useAuthStore.setState({
        user: null,
        token: null,
        streak: 0,
        lastLoginDate: null,
        loginDates: [],
        isSyncing: false,
      });
      useSymptomStore.setState({ logs: [] });
      useSessionStore.setState({ sessions: [] });
      useAnalysisStore.setState({ reports: [] });
      AsyncStorage.removeItem('asthmasense_logged_in').catch(() => {});
      AsyncStorage.removeItem('asthmasense_symptoms').catch(() => {});
      AsyncStorage.removeItem('asthmasense_sessions').catch(() => {});
      AsyncStorage.removeItem('asthmasense_analysis').catch(() => {});
      AsyncStorage.removeItem('asthmasense_emergency_contact').catch(() => {});
      
      // Clear weekly report limit keys from AsyncStorage to prevent leakage across logins
      AsyncStorage.getAllKeys().then((keys) => {
        const reportWeekKeys = keys.filter((key) => key.startsWith('asthmasense_report_week_'));
        if (reportWeekKeys.length > 0) {
          AsyncStorage.multiRemove(reportWeekKeys).catch(() => {});
        }
      }).catch(() => {});
    },
    checkLoginStreak: () => {
      const today = new Date().toISOString().split('T')[0];
      const currentStreak = useAuthStore.getState().streak || 0;
      const lastLogin = useAuthStore.getState().lastLoginDate;
      const currentDates = useAuthStore.getState().loginDates || [];

      // Append today to unique login dates history (persistent & cumulative)
      let nextDates = [...currentDates];
      if (!nextDates.includes(today)) {
        nextDates.push(today);
      }

      const syncStreak = () => {
        const token = useAuthStore.getState().token;
        if (token && token !== 'demo-token') {
          fetch(`${API_BASE_URL}/api/auth/streak`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              streak: useAuthStore.getState().streak,
              lastLoginDate: useAuthStore.getState().lastLoginDate,
              loginDates: useAuthStore.getState().loginDates,
            }),
          }).catch((err) => console.warn('Failed to sync login streak:', err));
        }
      };

      if (!lastLogin) {
        // First login ever
        useAuthStore.setState({ streak: 1, lastLoginDate: today, loginDates: nextDates });
        syncStreak();
        return;
      }

      if (lastLogin === today) {
        // Already checked in today
        if (currentStreak === 0) {
          useAuthStore.setState({ streak: 1, loginDates: nextDates });
        } else {
          useAuthStore.setState({ loginDates: nextDates });
        }
        syncStreak();
        return;
      }

      // Check consecutive days
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Day directly following the last login
        useAuthStore.setState({ streak: currentStreak + 1, lastLoginDate: today, loginDates: nextDates });
      } else {
        // Missed a day or more, reset streak to 1
        useAuthStore.setState({ streak: 1, lastLoginDate: today, loginDates: nextDates });
      }
      syncStreak();
    },
  } as any,
  'asthmasense_auth'
);

// ─── SYMPTOM STORE ───────────────────────────────────────────────────────────

export interface SymptomLog {
  id: string;
  symptom: string;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  time: string;
  notes?: string;
  createdAt: number;
}

interface SymptomState {
  logs: SymptomLog[];
  addLog: (log: Omit<SymptomLog, 'id' | 'createdAt'>) => void;
}

export const useSymptomStore = createStore<SymptomState>(
  {
    logs: [],
    addLog: async (log: Omit<SymptomLog, 'id' | 'createdAt'>) => {
      const current = useSymptomStore.getState().logs || [];
      const newLog: SymptomLog = {
        ...log,
        id: Math.random().toString(36).slice(2),
        createdAt: Date.now(),
      };
      useSymptomStore.setState({ logs: [newLog, ...current] });

      const token = useAuthStore.getState().token;
      if (token && token !== 'demo-token') {
        try {
          await fetch(`${API_BASE_URL}/api/data/symptoms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(log),
          });
        } catch (e) {
          console.warn('Failed to sync symptom log:', e);
        }
      }
    },
  } as any,
  'asthmasense_symptoms'
);

// ─── SESSION STORE ───────────────────────────────────────────────────────────

export interface Session {
  id: string;
  exercise: string;
  cycles: number;
  date: number;
}

interface SessionState {
  sessions: Session[];
  addSession: (s: { exercise: string; cycles: number }) => void;
}

export const useSessionStore = createStore<SessionState>(
  {
    sessions: [],
    addSession: async (s: { exercise: string; cycles: number }) => {
      const current = useSessionStore.getState().sessions || [];
      const newSession: Session = {
        id: Math.random().toString(36).slice(2),
        date: Date.now(),
        ...s,
      };
      useSessionStore.setState({ sessions: [newSession, ...current] });

      const token = useAuthStore.getState().token;
      if (token && token !== 'demo-token') {
        try {
          await fetch(`${API_BASE_URL}/api/data/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(s),
          });
        } catch (e) {
          console.warn('Failed to sync breathing session:', e);
        }
      }
    },
  } as any,
  'asthmasense_sessions'
);

// ─── ANALYSIS STORE ──────────────────────────────────────────────────────────

export interface AudioReport {
  id: string;
  date: number;
  wheezingDetected: 'Yes' | 'No';
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;
  transcript: string;
  clinicalFindings?: string;  // Detailed AI clinical observations
  rr: string;          // e.g. "16 bpm"
  pattern: string;     // e.g. "Dry · 4 events"
  regularity: string;  // e.g. "92%"
  recommendedExercise: string; // e.g. "pursed" or "none"
  recommendations?: string[];
}

interface AnalysisState {
  reports: AudioReport[];
  addReport: (report: Omit<AudioReport, 'id' | 'date'>) => void;
}

export const useAnalysisStore = createStore<AnalysisState>(
  {
    reports: [],
    addReport: async (report: Omit<AudioReport, 'id' | 'date'>) => {
      const current = useAnalysisStore.getState().reports || [];
      const newReport: AudioReport = {
        ...report,
        id: Math.random().toString(36).slice(2),
        date: Date.now(),
      };
      useAnalysisStore.setState({ reports: [newReport, ...current] });

      const token = useAuthStore.getState().token;
      if (token && token !== 'demo-token') {
        try {
          await fetch(`${API_BASE_URL}/api/data/reports`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(report),
          });
        } catch (e) {
          console.warn('Failed to sync audio report:', e);
        }
      }
    },
  } as any,
  'asthmasense_analysis'
);

// ─── BACKEND SYNC DATA HELPER ────────────────────────────────────────────────

export async function syncUserDataFromBackend() {
  const token = useAuthStore.getState().token;
  if (!token || token === 'demo-token') return;

  useAuthStore.setState({ isSyncing: true });

  try {
    // 1. Fetch symptoms
    const symRes = await fetch(`${API_BASE_URL}/api/data/symptoms`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (symRes.ok) {
      const symData = await symRes.json();
      const logs = symData.map((l: any) => ({
        id: l._id,
        symptom: l.symptom,
        severity: l.severity,
        time: l.time,
        notes: l.notes,
        createdAt: new Date(l.createdAt).getTime(),
      }));
      useSymptomStore.setState({ logs });
    }

    // 2. Fetch sessions
    const sessRes = await fetch(`${API_BASE_URL}/api/data/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (sessRes.ok) {
      const sessData = await sessRes.json();
      const sessions = sessData.map((s: any) => ({
        id: s._id,
        exercise: s.exercise,
        cycles: s.cycles,
        date: new Date(s.date).getTime(),
      }));
      useSessionStore.setState({ sessions });
    }

    // 3. Fetch reports
    const repRes = await fetch(`${API_BASE_URL}/api/data/reports`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (repRes.ok) {
      const repData = await repRes.json();
      const reports = repData.map((r: any) => ({
        id: r._id,
        wheezingDetected: r.wheezingDetected,
        riskLevel: r.riskLevel,
        confidence: r.confidence,
        summary: r.summary,
        transcript: r.transcript,
        clinicalFindings: r.clinicalFindings,
        rr: r.rr,
        pattern: r.pattern,
        regularity: r.regularity,
        recommendedExercise: r.recommendedExercise,
        recommendations: r.recommendations,
        foodsToEat: r.foodsToEat || [],
        foodsToAvoid: r.foodsToAvoid || [],
        date: new Date(r.date).getTime(),
      }));
      useAnalysisStore.setState({ reports });
    }
  } catch (e) {
    console.warn('Failed to sync user data from backend:', e);
  } finally {
    useAuthStore.setState({ isSyncing: false });
  }
}
