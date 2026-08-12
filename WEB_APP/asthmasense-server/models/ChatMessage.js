const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    sessionId: { type: String, required: false },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    model: { type: String, default: 'grok-2' },
  },
  { timestamps: true },
);

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
