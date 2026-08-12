const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    date: { type: Date, default: Date.now },
    audioFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioFile', index: true },
    audioUri: { type: String },
    audioUrl: { type: String },
    fileName: { type: String, default: 'respiratory_audio.wav' },
    audioMimeType: { type: String, default: 'audio/wav' },
    audioDuration: { type: Number, default: 5 },
    audioSize: { type: Number, default: 0 },
    wheezingDetected: { type: String, enum: ['Yes', 'No'] },
    riskLevel: { type: String, enum: ['Low', 'Moderate', 'High'] },
    confidence: { type: String },
    summary: String,
    transcript: String,
    clinicalFindings: String,
    rr: String,
    pattern: String,
    regularity: String,
    wheezePattern: String,
    recommendedExercise: String,
    recommendations: [String],
    foodsToEat: [String],
    foodsToAvoid: [String],
  },
  { timestamps: true },
);

module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema, 'audioreports');
