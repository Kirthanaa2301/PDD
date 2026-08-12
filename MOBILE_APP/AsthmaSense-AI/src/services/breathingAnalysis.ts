import {
  API_BASE_URL,
  BREATHING_ANALYZE_URL,
  BREATHING_HEALTH_URL,
} from '../config/api';

export type BreathingAnalysisResult = {
  wheezingDetected: 'Yes' | 'No';
  riskLevel: 'Low' | 'Moderate' | 'High';
  summary: string;
  confidence: string;
  transcript: string;
  model: string;
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
  formData.append('audio', {
    uri: source.uri,
    name: source.name,
    type: source.mimeType,
  } as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(BREATHING_ANALYZE_URL, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      `Cannot reach server at ${API_BASE_URL}. Start the API (npm run dev in asthmasense-server) and use the same Wi‑Fi.`,
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
