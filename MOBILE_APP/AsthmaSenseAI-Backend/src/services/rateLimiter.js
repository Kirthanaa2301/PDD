import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIMIT_FILE = path.resolve(__dirname, '../../gemini-limit.json');

const DAILY_LIMIT = 20;
const MINUTE_LIMIT = 5;

/**
 * Returns the current date in local YYYY-MM-DD format.
 * @returns {string}
 */
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * Checks if the Gemini limit is reached:
 * - max 5 requests per minute (RPM)
 * - max 20 requests per day (RPD)
 * If allowed, increments the counters and writes to disk.
 * @returns {{ allowed: boolean, count: number }}
 */
export function checkAndIncrementGeminiLimit() {
  const today = getTodayString();
  const now = Date.now();
  let data = { date: today, dailyCount: 0, minuteTimestamps: [] };

  try {
    if (fs.existsSync(LIMIT_FILE)) {
      const raw = fs.readFileSync(LIMIT_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today) {
        data = {
          date: parsed.date || today,
          dailyCount: parsed.dailyCount || parsed.count || 0,
          minuteTimestamps: Array.isArray(parsed.minuteTimestamps) ? parsed.minuteTimestamps : []
        };
      }
    }
  } catch (err) {
    console.error('Error reading Gemini daily limit file:', err.message);
  }

  // Filter out timestamps older than 1 minute (60 seconds)
  data.minuteTimestamps = data.minuteTimestamps.filter(t => now - t < 60000);

  // Enforce Daily Limit (max 20 RPD)
  if (data.dailyCount >= DAILY_LIMIT) {
    console.warn(`Gemini Daily Limit of ${DAILY_LIMIT} requests reached.`);
    return { allowed: false, count: data.dailyCount };
  }

  // Enforce Minutely Limit (max 5 RPM)
  if (data.minuteTimestamps.length >= MINUTE_LIMIT) {
    console.warn(`Gemini Minutely Limit of ${MINUTE_LIMIT} requests reached.`);
    return { allowed: false, count: data.dailyCount };
  }

  // Increment counters
  data.dailyCount += 1;
  data.minuteTimestamps.push(now);

  try {
    fs.writeFileSync(LIMIT_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing Gemini daily limit file:', err.message);
  }

  return { allowed: true, count: data.dailyCount };
}
