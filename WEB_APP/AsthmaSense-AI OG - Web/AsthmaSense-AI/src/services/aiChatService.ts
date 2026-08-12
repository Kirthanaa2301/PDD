import { CHAT_API_URL, CHAT_HISTORY_URL } from '../config/api';

export type ChatMessageItem = {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
};

export type ChatResponse = {
  reply: string;
  model: string;
  savedToDb: boolean;
  error?: string;
};

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  sessionId?: string,
): Promise<ChatResponse> {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        sessionId: sessionId || 'default',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof data.error === 'string'
          ? data.error
          : `Chat request failed with status ${response.status}`,
      );
    }

    return {
      reply: data.reply || 'No response received from AI.',
      model: data.model || 'grok-2',
      savedToDb: !!data.savedToDb,
    };
  } catch (err: any) {
    console.error('sendChatMessage error:', err);
    throw new Error(
      err.message || 'Unable to connect to AsthmaSense AI server. Please check your internet connection.',
    );
  }
}

export async function fetchChatHistory(sessionId: string = 'default'): Promise<ChatMessageItem[]> {
  try {
    const url = `${CHAT_HISTORY_URL}?sessionId=${encodeURIComponent(sessionId)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('fetchChatHistory failed:', err);
    return [];
  }
}
