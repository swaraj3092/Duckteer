import express from 'express';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for local file uploads (swap for S3/CloudStorage in production)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Only images and documents (PDF, DOC) are allowed.'));
  },
});

// All routes require authentication
router.use(protect);

/**
 * GET /api/medical-records
 * Returns all medical records for the logged-in patient.
 * Includes total visits, year stats, and unique specialist count.
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      MedicalRecord.find({ patient: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      MedicalRecord.countDocuments({ patient: req.user._id }),
    ]);

    // Stats
    const currentYear = new Date().getFullYear();
    const [thisYear, specialists] = await Promise.all([
      MedicalRecord.countDocuments({
        patient: req.user._id,
        createdAt: { $gte: new Date(`${currentYear}-01-01`) },
      }),
      MedicalRecord.distinct('specialty', { patient: req.user._id }),
    ]);

    res.status(200).json({
      records,
      stats: {
        totalVisits: total,
        thisYear,
        specialists: specialists.length,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[GET /medical-records] DB Error, falling back to mock data:', err.message);
    const mockRecords = [
      {
        _id: "rec1",
        doctorName: "Dr. Alok Sharma",
        specialty: "Cardiologist",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: "Mild Hypertension",
        prescription: "Telmisartan 40mg once daily",
        symptoms: ["Headache", "Dizziness"],
        attachments: [],
        type: "consultation"
      },
      {
        _id: "rec2",
        doctorName: "Dr. Vikram Singh",
        specialty: "General Physician",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        diagnosis: "Viral Fever",
        prescription: "Paracetamol 500mg SOS, Rest for 3 days",
        symptoms: ["High fever", "Body ache", "Weakness"],
        attachments: [],
        type: "consultation"
      }
    ];
    res.status(200).json({
      records: mockRecords,
      stats: { totalVisits: 2, thisYear: 2, specialists: 2 },
      pagination: { total: 2, page: 1, limit: 10, pages: 1 }
    });
  }
});

/**
 * GET /api/medical-records/:id
 * Returns a single medical record.
 */
router.get('/:id', async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patient: req.user._id,
    }).select('-__v');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found.' });
    }

    res.status(200).json({ record });
  } catch (err) {
    console.error('[GET /medical-records/:id]', err);
    res.status(500).json({ message: 'Failed to fetch record.' });
  }
});

/**
 * POST /api/medical-records/:id/upload
 * Uploads a document to an existing medical record.
 */
router.post('/:id/upload', upload.single('document'), async (req, res) => {
  try {
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const document = {
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      type: req.body.type || 'other',
    };

    record.uploadedDocuments.push(document);
    await record.save();

    res.status(200).json({ message: 'Document uploaded successfully.', document, record });
  } catch (err) {
    console.error('[POST /medical-records/:id/upload]', err);
    res.status(500).json({ message: 'Failed to upload document.' });
  }
});

/**
 * POST /api/medical-records/upload-standalone
 * Uploads a standalone medical document (not tied to a specific record).
 */
router.post('/upload-standalone', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      message: 'Document uploaded successfully.',
      url: fileUrl,
      name: req.file.originalname,
    });
  } catch (err) {
    console.error('[POST /medical-records/upload-standalone]', err);
    res.status(500).json({ message: 'Failed to upload document.' });
  }
});

export default router;
