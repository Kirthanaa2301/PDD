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

  const lanHost = getExpoLanHost();
  if (lanHost) {
    return `http://${lanHost}:${API_PORT}`;
  }

  // Cloud production API fallback
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return 'https://asthmasense-server.vercel.app';
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }
  return `https://asthmasense-server.vercel.app`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const BREATHING_ANALYZE_URL = `${API_BASE_URL}/api/breathing/analyze`;
export const BREATHING_HEALTH_URL = `${API_BASE_URL}/api/breathing/health`;
