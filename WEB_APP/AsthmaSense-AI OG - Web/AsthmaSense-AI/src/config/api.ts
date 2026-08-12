import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 5000;

/** Extract LAN IP from Expo Go / Metro (e.g. 10.12.105.157:8082 → 10.12.105.157) */
function getExpoLanHost(): string | undefined {
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost,
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const host = raw.replace(/^https?:\/\//, '').split(':')[0]?.trim();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }
  return undefined;
}

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // Production web deployment: point to live Vercel backend API
      return 'https://asthmasense-server.vercel.app';
    }
  }

  const lanHost = getExpoLanHost();
  if (lanHost) {
    return `http://${lanHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const BREATHING_ANALYZE_URL = `${API_BASE_URL}/api/breathing/analyze`;
export const BREATHING_HEALTH_URL = `${API_BASE_URL}/api/breathing/health`;
export const CHAT_API_URL = `${API_BASE_URL}/api/chat`;
export const CHAT_HISTORY_URL = `${API_BASE_URL}/api/chat/history`;

