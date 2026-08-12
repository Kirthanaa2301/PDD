import { Router } from 'express';
import { authenticateToken } from './auth.js';
import SymptomLog from '../models/SymptomLog.js';
import Session from '../models/Session.js';
import AudioReport from '../models/AudioReport.js';

const router = Router();

// ─── SYMPTOM LOGS ────────────────────────────────────────────────────────────

// @route   GET /api/data/symptoms
// @desc    Get all symptom logs for the current authenticated user
router.get('/symptoms', authenticateToken, async (req, res) => {
  try {
    const logs = await SymptomLog.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching symptom logs:', err);
    res.status(500).json({ error: 'Server error fetching symptom logs.' });
  }
});

// @route   POST /api/data/symptoms
// @desc    Add a symptom log for the current authenticated user
router.post('/symptoms', authenticateToken, async (req, res) => {
  const { symptom, severity, time, notes } = req.body;

  if (!symptom || !severity || !time) {
    return res.status(400).json({ error: 'Please provide symptom, severity, and time.' });
  }

  try {
    const newLog = new SymptomLog({
      userId: req.user._id,
      symptom,
      severity,
      time,
      notes,
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error saving symptom log:', err);
    res.status(500).json({ error: 'Server error saving symptom log.' });
  }
});

// ─── BREATHING SESSIONS ──────────────────────────────────────────────────────

// @route   GET /api/data/sessions
// @desc    Get all breathing sessions for the current authenticated user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching breathing sessions:', err);
    res.status(500).json({ error: 'Server error fetching breathing sessions.' });
  }
});

// @route   POST /api/data/sessions
// @desc    Add a breathing session for the current authenticated user
router.post('/sessions', authenticateToken, async (req, res) => {
  const { exercise, cycles } = req.body;

  if (!exercise || cycles === undefined) {
    return res.status(400).json({ error: 'Please provide exercise type and cycles.' });
  }

  try {
    const newSession = new Session({
      userId: req.user._id,
      exercise,
      cycles,
    });

    await newSession.save();
    res.status(201).json(newSession);
  } catch (err) {
    console.error('Error saving breathing session:', err);
    res.status(500).json({ error: 'Server error saving breathing session.' });
  }
});

// ─── AUDIO REPORTS ───────────────────────────────────────────────────────────

// @route   GET /api/data/reports
// @desc    Get all AI analysis reports for the current authenticated user
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await AudioReport.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching audio reports:', err);
    res.status(500).json({ error: 'Server error fetching audio reports.' });
  }
});

// @route   POST /api/data/reports
// @desc    Add an AI analysis report for the current authenticated user
router.post('/reports', authenticateToken, async (req, res) => {
  const {
    wheezingDetected,
    riskLevel,
    confidence,
    summary,
    transcript,
    clinicalFindings,
    rr,
    pattern,
    regularity,
    recommendedExercise,
    recommendations,
    foodsToEat,
    foodsToAvoid,
  } = req.body;

  if (!wheezingDetected || !riskLevel || !confidence || !summary || !transcript) {
    return res.status(400).json({ error: 'Missing required report fields.' });
  }

  try {
    const newReport = new AudioReport({
      userId: req.user._id,
      wheezingDetected,
      riskLevel,
      confidence,
      summary,
      transcript,
      clinicalFindings,
      rr,
      pattern,
      regularity,
      recommendedExercise,
      recommendations,
      foodsToEat,
      foodsToAvoid,
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    console.error('Error saving audio report:', err);
    res.status(500).json({ error: 'Server error saving audio report.' });
  }
});

export default router;
