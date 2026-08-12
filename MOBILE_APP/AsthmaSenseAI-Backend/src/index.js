import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import breathingRouter from './routes/breathing.js';
import authRouter from './routes/auth.js';
import dataRouter from './routes/data.js';

const app = express();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asthmasense';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'asthmasense-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);
app.use('/api/breathing', breathingRouter);

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Bad request' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn('  WARNING: GROQ_API_KEY is not set. Copy .env.example to .env');
  }
});
