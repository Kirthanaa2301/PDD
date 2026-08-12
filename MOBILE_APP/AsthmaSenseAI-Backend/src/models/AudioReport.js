import mongoose from 'mongoose';

const AudioReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wheezingDetected: {
    type: String,
    enum: ['Yes', 'No'],
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High'],
    required: true,
  },
  confidence: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
  clinicalFindings: {
    type: String,
  },
  rr: {
    type: String,
  },
  pattern: {
    type: String,
  },
  regularity: {
    type: String,
  },
  recommendedExercise: {
    type: String,
  },
  recommendations: {
    type: [String],
    default: [],
  },
  foodsToEat: {
    type: [String],
    default: [],
  },
  foodsToAvoid: {
    type: [String],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const AudioReport = mongoose.model('AudioReport', AudioReportSchema);
export default AudioReport;
