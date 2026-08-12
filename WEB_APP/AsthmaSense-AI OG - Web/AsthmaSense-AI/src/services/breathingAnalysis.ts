import { Platform } from 'react-native';
import {
  API_BASE_URL,
  BREATHING_ANALYZE_URL,
  BREATHING_HEALTH_URL,
} from '../config/api';

export type BreathingAnalysisResult = {
  isValidAudio?: boolean;
  wheezingDetected: 'Yes' | 'No';
  riskLevel: 'Low' | 'Moderate' | 'High';
  summary: string;
  confidence: string;
  transcript: string;
  model: string;
  condition?: string;
  classification?: string;
  rawConfidence?: number;
  recommendedExercise?: string;
  recommendations?: string[];
  rr?: string;
  pattern?: string;
  regularity?: string;
  foodsToEat?: string[];
  foodsToAvoid?: string[];
};

export type ApiHealth = {
  ok: boolean;
  whisperModel?: string;
  hasApiKey?: boolean;
};

type UploadSource = {
  uri: string;
  name: string;
  mimeType: string;
};

export async function checkApiHealth(): Promise<ApiHealth> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(BREATHING_HEALTH_URL, {
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok && data.ok === true, ...data };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeBreathingAudio(
  source: UploadSource,
): Promise<BreathingAnalysisResult> {
  const formData = new FormData();
  
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(source.uri);
      const blob = await res.blob();
      formData.append('audio', blob, source.name || 'recording.wav');
    } else {
      formData.append('audio', {
        uri: source.uri,
        name: source.name || 'recording.wav',
        type: source.mimeType || 'audio/wav',
      } as unknown as Blob);
    }
  } catch (blobErr) {
    console.warn('Failed to resolve audio blob, using raw structure:', blobErr);
    formData.append('audio', {
      uri: source.uri,
      name: source.name || 'recording.wav',
      type: source.mimeType || 'audio/wav',
    } as unknown as Blob);
  }

  let response: Response;
  try {
    response = await fetch(BREATHING_ANALYZE_URL, {
      method: 'POST',
      body: formData,
    });
  } catch (netErr) {
    console.warn(`Cannot reach server at ${BREATHING_ANALYZE_URL}:`, netErr);
    throw new Error(
      `Cannot reach server at ${API_BASE_URL}. Please verify your connection or try again.`,
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : `Analysis failed (${response.status})`,
    );
  }

  return data as BreathingAnalysisResult;
}
