import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { analyzeTranscription, transcribeAudio, generateClinicalReport } from '../services/groqAnalysis.js';
import { analyzeAudioWithGemini } from '../services/geminiAnalysis.js';
import { checkAndIncrementGeminiLimit } from '../services/rateLimiter.js';
import { authenticateToken } from './auth.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(os.tmpdir(), 'asthmasense-uploads');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.m4a';
      cb(null, `audio-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(flac|mp3|mp4|mpeg|mpga|m4a|ogg|wav|webm)$/i;
    const ok =
      allowed.test(file.originalname) ||
      (file.mimetype && file.mimetype.startsWith('audio/'));
    if (ok) cb(null, true);
    else cb(new Error('Unsupported audio format. Use mp3, m4a, wav, ogg, webm, etc.'));
  },
});

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    whisperModel: 'whisper-large-v3-turbo',
    hasApiKey: Boolean(process.env.GROQ_API_KEY),
  });
});

router.post('/analyze', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided. Use field name "audio".' });
  }

  const filePath = req.file.path;
  let analysisResult = null;
  let modelUsed = '';
  let transcription = null;

  try {
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    let geminiAllowed = false;

    if (hasGeminiKey) {
      const limitCheck = checkAndIncrementGeminiLimit();
      geminiAllowed = limitCheck.allowed;
      if (!geminiAllowed) {
        console.warn('Gemini rate limits reached. Skipping Gemini tiers and cascading...');
      }
    }

    // ==========================================
    // TIER 1: Gemini 3.5 Flash
    // ==========================================
    if (hasGeminiKey && geminiAllowed) {
      try {
        console.log('Tier 1: Attempting Gemini 3.5 Flash direct audio analysis...');
        const analysis = await analyzeAudioWithGemini(filePath, req.file.mimetype, 'gemini-3.5-flash');

        if (analysis.invalid === true || analysis.invalid === 'true' || String(analysis.invalid).toLowerCase() === 'yes') {
          return res.status(400).json({
            error: 'Invalid audio recording. Please upload a clear recording containing breathing, coughing, or wheezing.'
          });
        }

        analysisResult = analysis;
        modelUsed = 'gemini-3.5-flash';
      } catch (geminiErr) {
        console.warn('Tier 1 (Gemini 3.5 Flash) failed, cascading to Tier 2:', geminiErr.message);
      }
    }

    // ==========================================
    // TIER 2: Gemini 2.5 Flash
    // ==========================================
    if (!analysisResult && hasGeminiKey && geminiAllowed) {
      try {
        console.log('Tier 2: Attempting Gemini 2.5 Flash direct multimodal audio analysis...');
        const analysis = await analyzeAudioWithGemini(filePath, req.file.mimetype, 'gemini-2.5-flash');

        if (analysis.invalid === true || analysis.invalid === 'true' || String(analysis.invalid).toLowerCase() === 'yes') {
          return res.status(400).json({
            error: 'Invalid audio recording. Please upload a clear recording containing breathing, coughing, or wheezing.'
          });
        }

        analysisResult = analysis;
        modelUsed = 'gemini-2.5-flash';
      } catch (geminiErr2) {
        console.warn('Tier 2 (Gemini 2.5 Flash) failed, cascading to Tier 3:', geminiErr2.message);
      }
    }

    // ==========================================
    // TIER 3: Groq fallback (Whisper + Llama 3.1 8B Instant)
    // ==========================================
    if (!analysisResult) {
      console.log('Tier 3: Executing Groq transcription and analysis fallback pipeline...');
      transcription = await transcribeAudio(
        filePath,
        req.file.originalname,
        req.file.mimetype,
      );

      const analysis = await analyzeTranscription(transcription);

      if (analysis.invalid === true || analysis.invalid === 'true' || String(analysis.invalid).toLowerCase() === 'yes') {
        return res.status(400).json({
          error: 'Invalid audio recording. Please upload a clear recording containing breathing, coughing, or wheezing.'
        });
      }

      analysisResult = analysis;
      modelUsed = analysis.model || 'whisper-large-v3';
    }

    // Respond with the successful analysis result and standard fields
    res.json({
      wheezingDetected: analysisResult.wheezingDetected,
      riskLevel: analysisResult.riskLevel,
      summary: analysisResult.summary,
      confidence: analysisResult.confidence,
      transcript: modelUsed.startsWith('gemini') ? analysisResult.clinicalFindings : (analysisResult.transcript || transcription?.text || ''),
      recommendedExercise: analysisResult.recommendedExercise,
      recommendations: analysisResult.recommendations,
      rr: analysisResult.rr,
      pattern: analysisResult.pattern,
      regularity: analysisResult.regularity,
      foodsToEat: analysisResult.foodsToEat,
      foodsToAvoid: analysisResult.foodsToAvoid,
      model: modelUsed,
    });

  } catch (err) {
    console.error('Breathing analysis 3-tier pipeline error:', err);
    const message = err instanceof Error ? err.message : 'Analysis failed';
    res.status(500).json({ error: message });
  } finally {
    fs.promises.unlink(filePath).catch(() => { });
  }
});

router.post('/clinical-report', authenticateToken, async (req, res) => {
  try {
    const report = await generateClinicalReport(req.body, req.user.profile);
    res.json(report);
  } catch (err) {
    console.error('Clinical report generation error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate report' });
  }
});

export default router;
