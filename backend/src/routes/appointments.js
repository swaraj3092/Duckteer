import express from 'express';
import { Appointment } from '../models/Appointment.js';
import { Doctor } from '../models/Doctor.js';
import { MedicalRecord } from '../models/MedicalRecord.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * POST /api/appointments
 * Body: { doctorId, date, time, consultationType }
 * Books an appointment and marks the slot as taken.
 */
router.post('/', async (req, res) => {
  try {
    const { doctorId, date, time, consultationType, symptoms } = req.body;

    if (!doctorId || !date || !time || !consultationType) {
      return res.status(400).json({ message: 'doctorId, date, time, and consultationType are required.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    // Check if slot is still available
    const slotIndex = doctor.availability.findIndex(
      (s) => s.date === date && s.time === time && !s.isBooked
    );
    if (slotIndex === -1) {
      return res.status(409).json({ message: 'This slot is no longer available. Please choose another.' });
    }

    // Mark slot as booked
    doctor.availability[slotIndex].isBooked = true;
    await doctor.save();

    const fee = consultationType === 'video' ? doctor.consultationFee.video : doctor.consultationFee.chat;

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      time,
      consultationType,
      amount: fee,
      symptoms: symptoms || '',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('doctor', 'name specialty image rating')
      .populate('patient', 'name phone patientId');

    res.status(201).json({ message: 'Appointment booked successfully.', appointment: populated });
  } catch (err) {
    console.error('[POST /appointments]', err);
    res.status(500).json({ message: 'Failed to book appointment.' });
  }
});

/**
 * GET /api/appointments
 * Returns all appointments for the logged-in patient or doctor.
 * Query: ?status=scheduled
 */
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let appointments;

    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile) {
        return res.status(404).json({ message: 'Doctor profile not found.' });
      }

      const filter = { doctor: doctorProfile._id };
      if (status) filter.status = status;

      appointments = await Appointment.find(filter)
        .populate('patient', 'name phone age gender patientId')
        .sort({ date: -1, time: -1 });

    } else {
      // Patient view
      const filter = { patient: req.user._id };
      if (status) filter.status = status;

      appointments = await Appointment.find(filter)
        .populate('doctor', 'name specialty image rating languages')
        .sort({ date: -1, time: -1 });
    }

    res.status(200).json({ appointments });
  } catch (err) {
    console.error('[GET /appointments]', err);
    res.status(500).json({ message: 'Failed to fetch appointments.' });
  }
});

/**
 * GET /api/appointments/:id
 * Returns a single appointment with room details for video call.
 */
router.get('/:id', async (req, res) => {
  try {
    let query = { _id: req.params.id };

    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile) {
         return res.status(404).json({ message: 'Doctor profile not found.' });
      }
      query.doctor = doctorProfile._id;
    } else {
      query.patient = req.user._id;
    }

    const appointment = await Appointment.findOne(query)
      .populate('doctor', 'name specialty image rating languages bio qualifications')
      .populate('patient', 'name phone age gender patientId');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    res.status(200).json({ appointment });
  } catch (err) {
    console.error('[GET /appointments/:id]', err);
    res.status(500).json({ message: 'Failed to fetch appointment.' });
  }
});

/**
 * PATCH /api/appointments/:id/cancel
 * Cancels an appointment and frees the slot.
 */
router.patch('/:id/cancel', async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Free the slot in doctor's availability
    await Doctor.updateOne(
      {
        _id: appointment.doctor,
        'availability.date': appointment.date,
        'availability.time': appointment.time,
      },
      { $set: { 'availability.$.isBooked': false } }
    );

    res.status(200).json({ message: 'Appointment cancelled successfully.', appointment });
  } catch (err) {
    console.error('[PATCH /appointments/:id/cancel]', err);
    res.status(500).json({ message: 'Failed to cancel appointment.' });
  }
});

/**
 * PATCH /api/appointments/:id/complete
 * Marks appointment complete and auto-creates a medical record.
 * Body: { diagnosis, notes, prescription }
 */
router.patch('/:id/complete', async (req, res) => {
  try {
    const { diagnosis, notes, prescription } = req.body;

    const appointment = await Appointment.findById(req.params.id).populate(
      'doctor',
      'name specialty'
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    appointment.status = 'completed';
    appointment.diagnosis = diagnosis || '';
    appointment.notes = notes || '';
    appointment.prescription = prescription || '';
    await appointment.save();

    // Auto-create a medical record
    await MedicalRecord.create({
      patient: appointment.patient,
      appointment: appointment._id,
      doctor: appointment.doctor._id,
      date: new Date(appointment.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      doctorName: appointment.doctor.name,
      specialty: appointment.doctor.specialty,
      diagnosis: diagnosis || 'Consultation completed',
      prescription: prescription || 'Available',
      notes: notes || '',
    });

    res.status(200).json({ message: 'Appointment completed and record saved.', appointment });
  } catch (err) {
    console.error('[PATCH /appointments/:id/complete]', err);
    res.status(500).json({ message: 'Failed to complete appointment.' });
  }
});

export default router;
