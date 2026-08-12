const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    exercise: { type: String, required: true },
    cycles: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.models.Session || mongoose.model('Session', SessionSchema);
