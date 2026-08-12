# AsthmaSense API (Express + Groq)

Proxies audio analysis so the **Groq API key never ships in the mobile app**.

## Setup

```bash
# From repo root (sibling of AsthmaSenseRN/)
cp .env.example .env
# Add GROQ_API_KEY from https://console.groq.com/keys
npm install
npm run dev
```

Server runs at `http://localhost:3001`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/breathing/health` | Health + key configured |
| POST | `/api/breathing/analyze` | `multipart/form-data` field `audio` |

### Response

```json
{
  "wheezingDetected": "Yes",
  "riskLevel": "Moderate",
  "summary": "...",
  "confidence": "Medium",
  "transcript": "...",
  "model": "whisper-large-v3-turbo"
}
```

## Pipeline

1. **Groq Whisper** `whisper-large-v3-turbo` — transcribe audio (`verbose_json`)
2. **Groq Chat** `llama-3.3-70b-versatile` — JSON analysis for wheezing + risk level

## Mobile app

Set in project root `.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001
```

Then restart Expo (`npx expo start --clear`).
