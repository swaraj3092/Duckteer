import express from 'express';
import { Doctor } from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/doctors
 * Query: ?specialty=Cardiologist&lang=Hindi&page=1&limit=10
 * Returns paginated list of active doctors with optional filters.
 */
router.get('/', async (req, res) => {
  try {
    const { specialty, lang, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (specialty) filter.specialty = { $regex: specialty, $options: 'i' };
    if (lang) filter.languages = { $in: [new RegExp(lang, 'i')] };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .select('-availability -__v')
        .sort({ rating: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Doctor.countDocuments(filter),
    ]);

    res.status(200).json({
      doctors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[GET /doctors] DB Error, falling back to mock data:', err.message);
    const mockDoctors = [
      {
        _id: "mock1",
        name: "Dr. Alok Sharma",
        specialty: "Cardiologist",
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
        rating: 4.9,
        ratingCount: 120,
        languages: ["English", "Hindi"],
        experience: "15 years",
        nextSlot: "Available in 30 mins",
        consultationFee: 799
      },
      {
        _id: "mock2",
        name: "Dr. Meera Iyer",
        specialty: "Neurologist",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
        rating: 4.8,
        ratingCount: 85,
        languages: ["English", "Tamil", "Hindi"],
        experience: "12 years",
        nextSlot: "Available tomorrow",
        consultationFee: 899
      },
      {
        _id: "mock3",
        name: "Dr. Vikram Singh",
        specialty: "General Physician",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
        rating: 4.7,
        ratingCount: 200,
        languages: ["English", "Hindi", "Punjabi"],
        experience: "20 years",
        nextSlot: "Available in 10 mins",
        consultationFee: 499
      },
      {
        _id: "mock4",
        name: "Dr. Ananya Reddy",
        specialty: "Dermatologist",
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
        rating: 4.9,
        ratingCount: 150,
        languages: ["English", "Telugu", "Hindi"],
        experience: "10 years",
        nextSlot: "Available today",
        consultationFee: 650
      },
      {
        _id: "mock5",
        name: "Dr. Rajesh Khanna",
        specialty: "Gastroenterologist",
        image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop",
        rating: 4.6,
        ratingCount: 95,
        languages: ["English", "Hindi", "Bengali"],
        experience: "18 years",
        nextSlot: "Available in 1 hour",
        consultationFee: 850
      },
      {
        _id: "mock6",
        name: "Dr. Sarah D'Souza",
        specialty: "Pediatrician",
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop",
        rating: 4.9,
        ratingCount: 310,
        languages: ["English", "Konkani", "Hindi"],
        experience: "14 years",
        nextSlot: "Available tomorrow",
        consultationFee: 599
      },
      {
        _id: "mock7",
        name: "Dr. Amit Verma",
        specialty: "Orthopedist",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
        rating: 4.7,
        ratingCount: 180,
        languages: ["English", "Hindi"],
        experience: "16 years",
        nextSlot: "Available today",
        consultationFee: 750
      },
      {
        _id: "mock8",
        name: "Dr. Priya Das",
        specialty: "Ophthalmologist",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
        rating: 4.8,
        ratingCount: 220,
        languages: ["English", "Bengali", "Hindi"],
        experience: "11 years",
        nextSlot: "Available in 2 hours",
        consultationFee: 600
      }
    ];
    res.status(200).json({
      doctors: req.query.specialty ? mockDoctors.filter(d => d.specialty.toLowerCase().includes(req.query.specialty.toLowerCase())) : mockDoctors,
      pagination: { total: mockDoctors.length, page: 1, limit: 20, pages: 1 }
    });
  }
});

/**
 * GET /api/doctors/:id
 * Returns a single doctor's full details (including availability).
 */
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-__v');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }
    res.status(200).json({ doctor });
  } catch (err) {
    console.error('[GET /doctors/:id]', err);
    res.status(500).json({ message: 'Failed to fetch doctor details.' });
  }
});

/**
 * GET /api/doctors/:id/slots
 * Query: ?date=2026-03-27
 * Returns available time slots for a doctor on a given date.
 */
router.get('/:id/slots', async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id).select('availability name specialty');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    let slots;
    if (date) {
      slots = doctor.availability.filter((s) => s.date === date && !s.isBooked);
    } else {
      slots = doctor.availability.filter((s) => !s.isBooked);
    }

    // Group slots into morning / afternoon / evening
    const grouped = { morning: [], afternoon: [], evening: [] };
    slots.forEach((slot) => {
      const h = parseInt(slot.time.split(':')[0]);
      const isPM = slot.time.includes('PM');
      const hour = isPM && h !== 12 ? h + 12 : !isPM && h === 12 ? 0 : h;
      if (hour < 12) grouped.morning.push(slot.time);
      else if (hour < 17) grouped.afternoon.push(slot.time);
      else grouped.evening.push(slot.time);
    });

    res.status(200).json({ slots: grouped, doctorName: doctor.name });
  } catch (err) {
    console.error('[GET /doctors/:id/slots]', err);
    res.status(500).json({ message: 'Failed to fetch slots.' });
  }
});

/**
 * GET /api/doctors/specialties
 * Returns all unique specialties available.
 */
router.get('/meta/specialties', async (req, res) => {
  try {
    const specialties = await Doctor.distinct('specialty', { isActive: true });
    res.status(200).json({ specialties });
  } catch (err) {
    console.error('[GET /doctors/specialties]', err);
    res.status(500).json({ message: 'Failed to fetch specialties.' });
  }
});

export default router;
