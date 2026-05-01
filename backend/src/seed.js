import mongoose from 'mongoose';
import { Doctor } from './models/Doctor.js';
import { MedicalRecord } from './models/MedicalRecord.js';
import { User } from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/duckteer';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // Create a demo user if not exists
    let demoUser = await User.findOne({ phone: "9876543210" });
    if (!demoUser) {
      demoUser = await User.create({
        phone: "9876543210",
        name: "Demo Patient",
        role: "patient",
        isVerified: true
      });
      console.log('Created Demo User');
    }

    // Clear existing mock data
    await Doctor.deleteMany({});
    await MedicalRecord.deleteMany({ patientId: demoUser._id });

    // Seed Doctors
    const doctors = [
      {
        name: "Dr. Alok Sharma",
        specialty: "Cardiologist",
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8ZG9jdG9yfHx8fHx8MTcxMTU2MzM0OQ&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=200",
        rating: 4.9,
        ratingCount: 120,
        languages: ["English", "Hindi"],
        experience: "15 years",
        nextSlot: "Available in 30 mins",
        consultationFee: 799,
        isActive: true
      },
      {
        name: "Dr. Meera Iyer",
        specialty: "Neurologist",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8ZmVtYWxlLGRvY3Rvcnx8fHx8fDE3MTE1NjMzNTE&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=200",
        rating: 4.8,
        ratingCount: 85,
        languages: ["English", "Tamil", "Hindi"],
        experience: "12 years",
        nextSlot: "Available tomorrow",
        consultationFee: 899,
        isActive: true
      },
      {
        name: "Dr. Vikram Singh",
        specialty: "General Physician",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8ZG9jdG9yfHx8fHx8MTcxMTU2MzQ3Ng&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=200",
        rating: 4.7,
        ratingCount: 200,
        languages: ["English", "Hindi", "Punjabi"],
        experience: "20 years",
        nextSlot: "Available in 10 mins",
        consultationFee: 499,
        isActive: true
      },
      {
        name: "Dr. Anita Desai",
        specialty: "Dermatologist",
        image: "https://images.unsplash.com/photo-1594824432258-29367468641a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8ZmVtYWxlLGRvY3Rvcnx8fHx8fDE3MTE1NjM1MTE&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=200",
        rating: 4.6,
        ratingCount: 150,
        languages: ["English", "Gujarati", "Hindi"],
        experience: "10 years",
        nextSlot: "Available in 1 hour",
        consultationFee: 599,
        isActive: true
      }
    ];

    const insertedDoctors = await Doctor.insertMany(doctors);
    console.log(`Inserted ${insertedDoctors.length} doctors`);

    // Seed Medical Records
    const records = [
      {
        patient: demoUser._id,
        doctor: insertedDoctors[0]._id,
        doctorName: insertedDoctors[0].name,
        specialty: insertedDoctors[0].specialty,
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        diagnosis: "Mild Hypertension",
        prescription: "Telmisartan 40mg once daily",
        notes: "Regular checkup needed in 3 months."
      },
      {
        patient: demoUser._id,
        doctor: insertedDoctors[2]._id,
        doctorName: insertedDoctors[2].name,
        specialty: insertedDoctors[2].specialty,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        diagnosis: "Viral Fever",
        prescription: "Paracetamol 500mg SOS, Rest for 3 days",
        notes: "Follow up if fever persists beyond 5 days."
      }
    ];

    const insertedRecords = await MedicalRecord.insertMany(records);
    console.log(`Inserted ${insertedRecords.length} records`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
