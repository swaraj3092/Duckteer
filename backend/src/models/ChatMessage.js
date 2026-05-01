import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'analyzing', null],
      default: null,
    },
    recommendedSpecialty: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
