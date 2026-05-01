import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema({
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  time: { type: String, required: true }, // '09:00 AM'
  isBooked: { type: Boolean, default: false },
});

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    languages: {
      type: [String],
      default: ['English', 'Hindi'],
    },
    experience: {
      type: String, // e.g. "15 years"
      default: '',
    },
    nextSlot: {
      type: String, // Human-readable e.g. "Available in 2 hours"
      default: 'Check schedule',
    },
    bio: {
      type: String,
      default: '',
    },
    qualifications: {
      type: [String],
      default: [],
    },
    consultationFee: {
      video: { type: Number, default: 599 },
      chat: { type: Number, default: 399 },
    },
    availability: [availabilitySlotSchema],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model('Doctor', doctorSchema);
