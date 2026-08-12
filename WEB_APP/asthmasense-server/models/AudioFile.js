const mongoose = require('mongoose');

const AudioFileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: 'audio/wav' },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: 5 },
    data: { type: Buffer, required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AudioFile || mongoose.model('AudioFile', AudioFileSchema, 'audiofiles');
