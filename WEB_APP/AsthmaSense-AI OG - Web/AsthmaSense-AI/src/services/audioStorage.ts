import { Platform } from 'react-native';

const DB_NAME = 'AsthmaSenseAudioDB';
const STORE_NAME = 'audio_tracks';
const DB_VERSION = 1;

// Synchronous in-memory fallback cache
const memoryAudioCache = new Map<string, string>();

if (typeof window !== 'undefined') {
  (window as any).__asthma_audio_cache = (window as any).__asthma_audio_cache || {};
}

function openDB(): Promise<IDBDatabase | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save audio Data URL or Blob permanently into IndexedDB and memory
 */
export async function saveAudioToStorage(key: string, dataUrl: string): Promise<void> {
  if (!key || !dataUrl) return;

  // 1. Save to memory cache
  memoryAudioCache.set(key, dataUrl);
  if (typeof window !== 'undefined') {
    (window as any).__asthma_audio_cache[key] = dataUrl;
  }

  // 2. Save to IndexedDB
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, dataUrl, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to save audio to IndexedDB:', err);
  }
}

/**
 * Retrieve audio Data URL by key (fileName, reportId, or timestamp)
 */
export async function getAudioFromStorage(key: string): Promise<string | null> {
  if (!key) return null;

  // 1. Check memory cache first
  if (memoryAudioCache.has(key)) {
    return memoryAudioCache.get(key)!;
  }
  if (typeof window !== 'undefined' && (window as any).__asthma_audio_cache?.[key]) {
    return (window as any).__asthma_audio_cache[key];
  }

  // 2. Check IndexedDB
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = (e: any) => {
        const item = e.target.result;
        if (item?.dataUrl) {
          memoryAudioCache.set(key, item.dataUrl);
          if (typeof window !== 'undefined') {
            (window as any).__asthma_audio_cache[key] = item.dataUrl;
          }
          resolve(item.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Helper to synchronously get from memory cache if already hydrated
 */
export function getAudioFromMemory(key: string): string | null {
  if (!key) return null;
  if (memoryAudioCache.has(key)) return memoryAudioCache.get(key)!;
  if (typeof window !== 'undefined' && (window as any).__asthma_audio_cache?.[key]) {
    return (window as any).__asthma_audio_cache[key];
  }
  return null;
}
