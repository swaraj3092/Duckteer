import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: String, // Stored as human-readable for easy display, e.g. 'March 20, 2026'
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    prescription: {
      type: String, // File URL or 'Available' placeholder
      default: 'Available',
    },
    notes: {
      type: String,
      default: '',
    },
    labReports: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    uploadedDocuments: [
      {
        name: String,
        url: String,
        type: String, // 'lab_report', 'prescription', 'scan', etc.
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
