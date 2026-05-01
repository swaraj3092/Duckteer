import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    height: {
      type: Number, // in cm
    },
    weight: {
      type: Number, // in kg
    },
    city: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      default: 'patient',
    },
    // For OTP flow
    otp: {
      code: String,
      expiresAt: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    patientId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Auto-generate patient ID before save
userSchema.pre('save', async function (next) {
  if (!this.patientId && this.role === 'patient') {
    const count = await mongoose.model('User').countDocuments({ role: 'patient' });
    const padded = String(count + 1).padStart(6, '0');
    this.patientId = `MED2026${padded}`;
  }
  next();
});

export const User = mongoose.model('User', userSchema);
