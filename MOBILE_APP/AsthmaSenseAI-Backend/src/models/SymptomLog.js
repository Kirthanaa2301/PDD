import mongoose from 'mongoose';

const SymptomLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symptom: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['none', 'mild', 'moderate', 'severe'],
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SymptomLog = mongoose.model('SymptomLog', SymptomLogSchema);
export default SymptomLog;
