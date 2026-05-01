import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
    },
    time: {
      type: String, // '10:00 AM'
      required: true,
    },
    consultationType: {
      type: String,
      enum: ['video', 'chat'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    amount: {
      type: Number,
      required: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    symptoms: {
      type: String,
      default: '',
    },
    aiAnalysis: {
      summary: { type: String, default: '' },
      recommendedSpecialty: { type: String, default: '' },
    },
    // Room ID for video call (Socket.io)
    roomId: {
      type: String,
      default: function () {
        return this._id.toString();
      },
    },
    notes: {
      type: String,
      default: '',
    },
    prescription: {
      type: String, // URL to prescription document
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
    },
    duration: {
      type: String, // '30 min'
      default: '30 min',
    },
  },
  { timestamps: true }
);

export const Appointment = mongoose.model('Appointment', appointmentSchema);
