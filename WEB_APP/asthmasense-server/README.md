# AsthmaSense AI — Backend

Express + MongoDB (Mongoose) + Groq backend for the AsthmaSense AI app, structured to deploy on Vercel as a single serverless function.

## Environment Variables

Set these in Vercel (Project → Settings → Environment Variables) and/or in a local `.env` file (copy `.env.example`):

- `MONGO_URI` — MongoDB Atlas connection string (include username/password, allow access from anywhere: 0.0.0.0/0)
- `JWT_SECRET` — any long random string, used to sign auth tokens
- `GROQ_API_KEY` — from console.groq.com

## Local development

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000`.

## Deploy to Vercel

1. Push this folder to its own GitHub repo.
2. Vercel → Add New Project → import the repo.
3. Add the three environment variables above.
4. Deploy. You'll get a URL like `https://asthmasense-server.vercel.app`.
5. In your **frontend** Vercel project, set `EXPO_PUBLIC_API_URL` to this backend URL (no trailing slash), then redeploy the frontend.

## Routes

### Auth
- `POST /api/auth/register` — { name, email, password } → { token, userProfile }
- `POST /api/auth/login` — { email, password } → { token, userProfile }
- `POST /api/auth/profile` (auth) — { age, severity, triggers, inhaler, frequency } → { userProfile }
- `POST /api/auth/streak` (auth) — { streak, lastLoginDate, loginDates } → { ok }
- `POST /api/auth/emergency-contact` (auth) — { emergencyContact } → { ok }
- `DELETE /api/auth/delete` (auth) → { ok }

### Data sync
- `GET/POST /api/data/symptoms` (auth)
- `GET/POST /api/data/sessions` (auth)
- `GET/POST /api/data/reports` (auth)

### Breathing AI
- `GET /api/breathing/health` → { ok, whisperModel, hasApiKey }
- `POST /api/breathing/analyze` — multipart form, field `audio` → analysis JSON
- `POST /api/breathing/clinical-report` (auth) — { sessions, streak, uniqueDaysLogged } → report JSON

All `(auth)` routes require header: `Authorization: Bearer <token>`
