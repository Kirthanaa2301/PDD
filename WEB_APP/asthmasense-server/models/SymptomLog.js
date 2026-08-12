const mongoose = require('mongoose');

const SymptomLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    symptom: { type: String, required: true },
    severity: { type: String, enum: ['none', 'mild', 'moderate', 'severe'], required: true },
    time: { type: String, required: true },
    notes: String,
  },
  { timestamps: true },
);

module.exports = mongoose.models.SymptomLog || mongoose.model('SymptomLog', SymptomLogSchema);
