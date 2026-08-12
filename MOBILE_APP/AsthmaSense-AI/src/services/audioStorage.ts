import AsyncStorage from '@react-native-async-storage/async-storage';

const AUDIO_STORAGE_PREFIX = '@asthmasense_audio_';
const MEMORY_CACHE = new Map<string, string>();

export async function saveAudioToStorage(key: string, dataUri: string): Promise<void> {
  try {
    MEMORY_CACHE.set(key, dataUri);
    await AsyncStorage.setItem(`${AUDIO_STORAGE_PREFIX}${key}`, dataUri);
  } catch (err) {
    console.warn('Failed to save audio to AsyncStorage:', err);
  }
}

export async function getAudioFromStorage(key: string): Promise<string | null> {
  try {
    if (MEMORY_CACHE.has(key)) {
      return MEMORY_CACHE.get(key) || null;
    }
    const data = await AsyncStorage.getItem(`${AUDIO_STORAGE_PREFIX}${key}`);
    if (data) {
      MEMORY_CACHE.set(key, data);
      return data;
    }
    return null;
  } catch (err) {
    console.warn('Failed to get audio from AsyncStorage:', err);
    return null;
  }
}

export function getAudioFromMemory(key: string): string | null {
  return MEMORY_CACHE.get(key) || null;
}

export function setAudioInMemory(key: string, dataUri: string): void {
  MEMORY_CACHE.set(key, dataUri);
}
