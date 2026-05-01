import express from 'express';
import { User } from '../models/User.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { protect } from '../middleware/auth.js';
import { mapUserToPatient, mapRecordToFhir, createFhirBundle } from '../adapters/fhir.js';

const router = express.Router();

// All routes require authentication (or a valid SHARP token)
router.use(protect);

/**
 * GET /api/fhir/Patient/:id
 * Returns a FHIR Patient resource.
 */
router.get('/Patient/:id', async (req, res) => {
  try {
    const user = await User.findOne({ 
      $or: [{ patientId: req.params.id }, { _id: req.params.id }] 
    });

    if (!user) {
      return res.status(404).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found", diagnostics: "Patient not found" }] });
    }

    res.status(200).json(mapUserToPatient(user));
  } catch (err) {
    res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: err.message }] });
  }
});

/**
 * GET /api/fhir/DiagnosticReport
 * Returns a bundle of medical records in FHIR format.
 */
router.get('/DiagnosticReport', async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user._id }).sort({ createdAt: -1 });
    const fhirRecords = records.map(mapRecordToFhir);
    res.status(200).json(createFhirBundle(fhirRecords));
  } catch (err) {
    res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: err.message }] });
  }
});

/**
 * GET /api/fhir/Everything
 * Custom endpoint to return all patient data in a single bundle (useful for agents).
 */
router.get('/Everything', async (req, res) => {
  try {
    const [user, records] = await Promise.all([
      User.findById(req.user._id),
      MedicalRecord.find({ patient: req.user._id }).sort({ createdAt: -1 })
    ]);

    const resources = [
      mapUserToPatient(user),
      ...records.map(mapRecordToFhir)
    ];

    res.status(200).json(createFhirBundle(resources));
  } catch (err) {
    res.status(500).json({ resourceType: "OperationOutcome", issue: [{ severity: "error", code: "exception", diagnostics: err.message }] });
  }
});

export default router;
