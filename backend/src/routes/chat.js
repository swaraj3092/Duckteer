import express from 'express';
import { ChatMessage } from '../models/ChatMessage.js';
import { Doctor } from '../models/Doctor.js';
import { protect } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to allow anonymous triage in development
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  // Allow anonymous access for triage
  req.user = { _id: "anonymous_user", name: "Guest", role: "patient" };
  next();
};

// Note: middleware is applied inline in the route definitions below

// ─── Enhanced AI Symptom Analysis Engine ──────────────────────────────────────

// Comprehensive symptom → specialty mapping with severity weights
const symptomDatabase = [
  // CARDIOLOGY — High priority
  { keywords: ['chest pain', 'chest tightness', 'chest pressure'], specialty: 'Cardiologist', baseUrgency: 9, category: 'cardiac' },
  { keywords: ['heart attack', 'cardiac arrest'], specialty: 'Cardiologist', baseUrgency: 10, category: 'cardiac' },
  { keywords: ['palpitation', 'irregular heartbeat', 'heart racing', 'heart pounding'], specialty: 'Cardiologist', baseUrgency: 7, category: 'cardiac' },
  { keywords: ['shortness of breath', 'breathing difficulty', 'breathless', 'saans nahi aa rahi', 'saans phoolna'], specialty: 'Cardiologist', baseUrgency: 8, category: 'cardiac' },
  { keywords: ['high blood pressure', 'bp high', 'hypertension'], specialty: 'Cardiologist', baseUrgency: 6, category: 'cardiac' },
  { keywords: ['swollen feet', 'leg swelling', 'ankle swelling'], specialty: 'Cardiologist', baseUrgency: 5, category: 'cardiac' },

  // NEUROLOGY
  { keywords: ['severe headache', 'worst headache', 'thunderclap headache'], specialty: 'Neurologist', baseUrgency: 8, category: 'neuro' },
  { keywords: ['seizure', 'convulsion', 'fit', 'epilepsy', 'mirgi'], specialty: 'Neurologist', baseUrgency: 9, category: 'neuro' },
  { keywords: ['stroke', 'face drooping', 'arm weakness', 'speech difficulty', 'lakwa'], specialty: 'Neurologist', baseUrgency: 10, category: 'neuro' },
  { keywords: ['headache', 'migraine', 'sir dard', 'sar dard'], specialty: 'Neurologist', baseUrgency: 4, category: 'neuro' },
  { keywords: ['dizziness', 'vertigo', 'chakkar', 'balance problem'], specialty: 'Neurologist', baseUrgency: 5, category: 'neuro' },
  { keywords: ['numbness', 'tingling', 'pins and needles', 'jhunjhuni'], specialty: 'Neurologist', baseUrgency: 5, category: 'neuro' },
  { keywords: ['memory loss', 'confusion', 'forgetfulness', 'bhoolna'], specialty: 'Neurologist', baseUrgency: 6, category: 'neuro' },

  // ONCOLOGY
  { keywords: ['cancer', 'tumor', 'tumour', 'malignant'], specialty: 'Oncologist', baseUrgency: 8, category: 'oncology' },
  { keywords: ['lump', 'mass', 'growth', 'swelling that grows', 'gaanth'], specialty: 'Oncologist', baseUrgency: 7, category: 'oncology' },
  { keywords: ['unexplained weight loss', 'rapid weight loss'], specialty: 'Oncologist', baseUrgency: 7, category: 'oncology' },

  // DERMATOLOGY
  { keywords: ['skin rash', 'rash', 'daad', 'khaj', 'kharish'], specialty: 'Dermatologist', baseUrgency: 3, category: 'skin' },
  { keywords: ['acne', 'pimple', 'muhase'], specialty: 'Dermatologist', baseUrgency: 2, category: 'skin' },
  { keywords: ['eczema', 'psoriasis', 'skin infection', 'fungal'], specialty: 'Dermatologist', baseUrgency: 4, category: 'skin' },
  { keywords: ['hair loss', 'baal jharna', 'ganjapan'], specialty: 'Dermatologist', baseUrgency: 2, category: 'skin' },

  // ORTHOPEDICS
  { keywords: ['fracture', 'broken bone', 'haddi toota'], specialty: 'Orthopedist', baseUrgency: 8, category: 'ortho' },
  { keywords: ['knee pain', 'joint pain', 'ghutne mein dard', 'jod dard'], specialty: 'Orthopedist', baseUrgency: 4, category: 'ortho' },
  { keywords: ['back pain', 'kamar dard', 'spine pain', 'slip disc'], specialty: 'Orthopedist', baseUrgency: 5, category: 'ortho' },
  { keywords: ['shoulder pain', 'neck pain', 'gardan dard'], specialty: 'Orthopedist', baseUrgency: 4, category: 'ortho' },

  // GASTROENTEROLOGY
  { keywords: ['severe stomach pain', 'appendix', 'appendicitis'], specialty: 'Gastroenterologist', baseUrgency: 8, category: 'gastro' },
  { keywords: ['blood in stool', 'blood vomit', 'khoon ki ulti'], specialty: 'Gastroenterologist', baseUrgency: 9, category: 'gastro' },
  { keywords: ['stomach pain', 'abdomen pain', 'pet dard', 'pet mein dard'], specialty: 'Gastroenterologist', baseUrgency: 5, category: 'gastro' },
  { keywords: ['acidity', 'acid reflux', 'heartburn', 'seene mein jalan'], specialty: 'Gastroenterologist', baseUrgency: 3, category: 'gastro' },
  { keywords: ['constipation', 'kabz', 'diarrhea', 'dast', 'loose motion'], specialty: 'Gastroenterologist', baseUrgency: 3, category: 'gastro' },
  { keywords: ['liver', 'jaundice', 'piliya', 'hepatitis'], specialty: 'Gastroenterologist', baseUrgency: 7, category: 'gastro' },
  { keywords: ['vomiting', 'nausea', 'ulti', 'ji machlana'], specialty: 'Gastroenterologist', baseUrgency: 4, category: 'gastro' },

  // PULMONOLOGY
  { keywords: ['asthma', 'dama', 'wheezing', 'bronchitis'], specialty: 'Pulmonologist', baseUrgency: 6, category: 'pulmo' },
  { keywords: ['cough with blood', 'khoon wali khansi'], specialty: 'Pulmonologist', baseUrgency: 9, category: 'pulmo' },
  { keywords: ['chronic cough', 'persistent cough', 'purani khansi'], specialty: 'Pulmonologist', baseUrgency: 4, category: 'pulmo' },
  { keywords: ['tuberculosis', 'tb', 'lung infection'], specialty: 'Pulmonologist', baseUrgency: 7, category: 'pulmo' },

  // ENDOCRINOLOGY
  { keywords: ['diabetes', 'sugar', 'blood sugar high', 'madhumeh', 'sugar ki bimari'], specialty: 'Endocrinologist', baseUrgency: 5, category: 'endo' },
  { keywords: ['thyroid', 'thyroxine', 'goiter'], specialty: 'Endocrinologist', baseUrgency: 4, category: 'endo' },
  { keywords: ['pcod', 'pcos', 'hormonal imbalance', 'hormone'], specialty: 'Endocrinologist', baseUrgency: 4, category: 'endo' },

  // OPHTHALMOLOGY
  { keywords: ['sudden vision loss', 'blind', 'dikhai nahi de raha'], specialty: 'Ophthalmologist', baseUrgency: 9, category: 'eye' },
  { keywords: ['eye pain', 'blurry vision', 'dhundhla', 'aankh dard'], specialty: 'Ophthalmologist', baseUrgency: 5, category: 'eye' },
  { keywords: ['red eye', 'eye infection', 'conjunctivitis'], specialty: 'Ophthalmologist', baseUrgency: 4, category: 'eye' },

  // ENT
  { keywords: ['ear pain', 'hearing loss', 'kaan dard', 'sunai nahi deta'], specialty: 'ENT Specialist', baseUrgency: 4, category: 'ent' },
  { keywords: ['sore throat', 'tonsil', 'gala dard', 'gala kharab'], specialty: 'ENT Specialist', baseUrgency: 3, category: 'ent' },
  { keywords: ['nose bleed', 'naak se khoon', 'sinusitis', 'sinus'], specialty: 'ENT Specialist', baseUrgency: 4, category: 'ent' },

  // NEPHROLOGY
  { keywords: ['kidney pain', 'kidney stone', 'gurde ki pathri', 'peshab mein khoon'], specialty: 'Nephrologist', baseUrgency: 7, category: 'nephro' },
  { keywords: ['urinary infection', 'uti', 'burning urine', 'peshab mein jalan'], specialty: 'Nephrologist', baseUrgency: 5, category: 'nephro' },

  // PSYCHIATRY
  { keywords: ['depression', 'anxiety', 'panic attack', 'suicidal', 'mental health'], specialty: 'Psychiatrist', baseUrgency: 7, category: 'psych' },
  { keywords: ['insomnia', 'neend nahi aati', 'sleep problem', 'stress'], specialty: 'Psychiatrist', baseUrgency: 4, category: 'psych' },

  // PEDIATRICS
  { keywords: ['child fever', 'baby sick', 'bachche ko bukhar', 'infant'], specialty: 'Pediatrician', baseUrgency: 6, category: 'pedia' },

  // GENERAL — catch-all
  { keywords: ['fever', 'bukhar', 'cold', 'sardi', 'flu', 'cough', 'khansi', 'viral'], specialty: 'General Physician', baseUrgency: 3, category: 'general' },
  { keywords: ['fatigue', 'tiredness', 'thakan', 'weakness', 'kamzori'], specialty: 'General Physician', baseUrgency: 3, category: 'general' },
  { keywords: ['body pain', 'badan dard', 'muscle pain'], specialty: 'General Physician', baseUrgency: 3, category: 'general' },
];

// Time-based urgency modifiers
const urgencyModifiers = [
  { keywords: ['since morning', 'subah se', 'few hours', 'kuch ghante'], modifier: 1 },
  { keywords: ['sudden', 'achanak', 'just now', 'abhi abhi'], modifier: 2 },
  { keywords: ['past week', 'ek hafte se', 'several days', 'kai din'], modifier: 0 },
  { keywords: ['chronic', 'months', 'mahino se', 'long time', 'bahut dino se'], modifier: -1 },
  { keywords: ['severe', 'terrible', 'unbearable', 'bahut zyada', 'asahneeya', 'very bad'], modifier: 2 },
  { keywords: ['mild', 'thoda', 'slight', 'halka'], modifier: -1 },
  { keywords: ['worsening', 'getting worse', 'badh raha', 'increasing'], modifier: 1 },
];

// Follow-up questions based on category
const followUpQuestions = {
  cardiac: [
    'Does the pain radiate to your left arm or jaw?',
    'Are you experiencing sweating or nausea along with it?',
    'Do you have a history of heart disease?',
  ],
  neuro: [
    'When did the symptoms start?',
    'Have you had any recent head injury?',
    'Are you experiencing any visual disturbances?',
  ],
  gastro: [
    'Have you noticed any blood in your stool?',
    'Have you eaten anything unusual recently?',
    'How long have you been experiencing this?',
  ],
  ortho: [
    'Was there any injury or fall?',
    'Does the pain increase with movement?',
    'Is there any swelling or redness around the area?',
  ],
  general: [
    'How long have you been feeling this way?',
    'Do you have any other symptoms?',
    'Are you currently taking any medications?',
  ],
  default: [
    'How long have you been experiencing this?',
    'On a scale of 1-10, how would you rate the discomfort?',
    'Do you have any other symptoms along with this?',
  ],
};

import { GoogleGenAI, Type } from '@google/genai';

/**
 * Advanced symptom analysis with Gemini AI (supports Vision & Context)
 */
const runGeminiAnalysis = async (text, language = 'en', imageDatas = [], context = '') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const parts = [{ text: `Analyze these symptoms and provide a triage assessment. Language: ${language}. \n${context ? `Patient Context: ${context}` : ''} \nSymptoms: "${text}"` }];
    
    if (imageDatas && imageDatas.length > 0) {
      if (imageDatas.length > 1) {
        parts[0].text += `\n\nCRITICAL: Multiple images provided. These are progress photos of the same condition. Compare them carefully (e.g., Image 1 is Day X, Image 2 is Day Y). Note any improvements or worsening in the 'clinicalReasoning'.`;
      }
      imageDatas.forEach((img) => {
        parts.push({
          inlineData: {
            data: img.toString('base64'),
            mimeType: 'image/jpeg'
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: "You are an expert medical AI triage assistant. Your job is to analyze symptoms (text and images) provided by the user, determine the most relevant medical specialty to consult, assess the urgency, and ask follow-up questions. If an image is provided (e.g., a wound, rash, or swelling), analyze it carefully. IMPORTANT: Your output MUST be a valid JSON object matching the provided schema exactly. Always respond in the requested language for the 'responseMessage'. The JSON keys must always be in English. Be empathetic and clear. If you are unsure, still provide a best-guess JSON instead of failing.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            specialty: { type: Type.STRING, description: "The single most relevant medical specialty (e.g. Cardiologist, General Physician)" },
            allSpecialties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "All potentially relevant specialties" },
            urgencyScore: { type: Type.INTEGER, description: "Urgency score from 1 to 10 (10 being highest emergency)" },
            urgencyLevel: { type: Type.STRING, description: "One of: low, medium, high" },
            category: { type: Type.STRING, description: "General category of illness (e.g. cardiac, neuro, general)" },
            followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-3 follow up questions to ask the patient" },
            matchedSymptoms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key symptoms extracted from the text" },
            confidence: { type: Type.NUMBER, description: "Confidence score of the analysis (0.0 to 1.0)" },
            clinicalReasoning: { type: Type.STRING, description: "A detailed clinical explanation of why this specialty and urgency were chosen, citing specific symptoms or image findings." },
            responseMessage: { type: Type.STRING, description: "A conversational, empathetic response directed at the patient. Should include the urgency, recommended specialty, and follow-up questions. MUST be in the requested language." }
          },
          required: ["specialty", "allSpecialties", "urgencyScore", "urgencyLevel", "category", "followUpQuestions", "matchedSymptoms", "confidence", "clinicalReasoning", "responseMessage"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Gemini AI Analysis failed:", error);
    // Fallback if Gemini fails
    return {
      specialty: 'General Physician',
      allSpecialties: ['General Physician'],
      urgencyScore: 3,
      urgencyLevel: 'low',
      category: 'general',
      followUpQuestions: ['Can you provide more details?'],
      matchedSymptoms: [],
      confidence: 0.5,
      responseMessage: "I'm having trouble analyzing this right now, but I recommend consulting a General Physician."
    };
  }
};


// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/chat/session
 * Creates a new chat session.
 */
router.post('/session', optionalAuth, async (req, res) => {
  try {
    const sessionId = uuidv4();
    const { language } = req.body;

    const greetings = {
      en: "Hello! 👋 I'm your Duckteer AI health assistant. Tell me your symptoms — you can speak in your language or type here. I'll analyze them and connect you with the right specialist.",
      hi: "नमस्ते! 👋 मैं आपका Duckteer AI स्वास्थ्य सहायक हूं। अपने लक्षण बताएं — आप अपनी भाषा में बोल सकते हैं। मैं उनका विश्लेषण करूंगा और आपको सही विशेषज्ञ से जोड़ूंगा।",
      mr: "नमस्कार! 👋 मी तुमचा Duckteer AI आरोग्य सहाय्यक आहे। तुमची लक्षणे सांगा — तुम्ही तुमच्या भाषेत बोलू शकता. मी त्यांचे विश्लेषण करेन आणि तुम्हाला योग्य तज्ञांशी जोडेन.",
      bn: "নমস্কার! 👋 আমি আপনার Duckteer AI স্বাস্থ্য সহায়ক। আপনার উপসর্গগুলি বলুন — আপনি আপনার ভাষায় বলতে পারেন। আমি বিশ্লেষণ করব এবং সঠিক বিশেষজ্ঞের সাথে সংযুক্ত করব।",
      ta: "வணக்கம்! 👋 நான் உங்கள் Duckteer AI சுகாதார உதவியாளர். உங்கள் அறிகுறிகளை சொல்லுங்கள் — தமிழில் பேசலாம்.",
      te: "నమస్కారం! 👋 నేను మీ Duckteer AI ఆరోగ్య సహాయకుడిని. మీ లక్షణాలు చెప్పండి — తెలుగులో మాట్లాడవచ్చు.",
    };

    const greeting = {
      sessionId,
      type: 'ai',
      text: greetings[language] || greetings.en,
      language: language || 'en',
    };

    res.status(200).json(greeting);
  } catch (err) {
    console.error('[POST /chat/session]', err);
    res.status(500).json({ message: 'Failed to create chat session.' });
  }
});

/**
 * GET /api/chat/:sessionId
 */
router.get('/:sessionId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      sessionId: req.params.sessionId,
      patient: req.user._id,
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (err) {
    console.error('[GET /chat/:sessionId]', err);
    res.status(500).json({ message: 'Failed to fetch chat history.' });
  }
});

/**
 * POST /api/chat/:sessionId/message
 * Body: { text, language }
 * Saves user message, runs AI symptom analysis with urgency scoring,
 * saves AI reply, and returns analysis + matching doctors.
 */
router.post('/:sessionId/message', upload.array('image', 2), optionalAuth, async (req, res) => {
  try {
    const { text, language, context } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required.' });
    }

    const { sessionId } = req.params;

    // Save user message (with DB fallback)
    try {
      await ChatMessage.create({
        sessionId,
        patient: req.user._id,
        type: 'user',
        text: text.trim(),
      });
    } catch (dbErr) {
      console.warn('[chat] Could not save user message to DB:', dbErr.message);
    }

    // Run AI analysis
    const imageDatas = req.files ? req.files.map(f => f.buffer) : [];
    const analysis = await runGeminiAnalysis(text, language, imageDatas, context);
    const aiResponseText = analysis.responseMessage;

    // Save AI response (with DB fallback)
    let aiMessage = { text: aiResponseText, createdAt: new Date() };
    try {
      aiMessage = await ChatMessage.create({
        sessionId,
        patient: req.user._id,
        type: 'ai',
        text: aiResponseText,
        urgency: analysis.urgencyLevel,
        recommendedSpecialty: analysis.specialty,
      });
    } catch (dbErr) {
      console.warn('[chat] Could not save AI response to DB:', dbErr.message);
    }

    // Find matching doctors from database
    let matchingDoctors = [];
    try {
      matchingDoctors = await Doctor.find({
        specialty: { $regex: analysis.specialty, $options: 'i' },
        isActive: true,
      })
        .select('name specialty image rating languages experience nextSlot consultationFee')
        .sort({ rating: -1 })
        .limit(3);
    } catch (e) {
      // DB might not be connected, continue without doctors
      console.log('[chat] Could not fetch matching doctors:', e.message);
    }

    res.status(200).json({
      aiMessage,
      analysis: {
        specialty: analysis.specialty,
        allSpecialties: analysis.allSpecialties,
        urgencyScore: analysis.urgencyScore,
        urgencyLevel: analysis.urgencyLevel,
        confidence: analysis.confidence,
        matchedSymptoms: analysis.matchedSymptoms,
        followUpQuestions: analysis.followUpQuestions,
      },
      matchingDoctors,
    });
  } catch (err) {
    console.error('[POST /chat/:sessionId/message]', err);
    res.status(500).json({ message: 'Failed to process message.' });
  }
});

/**
 * POST /api/chat/quick-triage
 * Body: { symptoms }
 * Quick triage without session — returns urgency + recommended specialty instantly.
 * Used for the urgency card preview.
 */
router.post('/quick-triage', optionalAuth, async (req, res) => {
  try {
    const { symptoms, language } = req.body;
    if (!symptoms) {
      return res.status(400).json({ message: 'Symptoms text is required.' });
    }

    const analysis = await runGeminiAnalysis(symptoms, language || 'en');

    // Find matching doctors
    let matchingDoctors = [];
    try {
      matchingDoctors = await Doctor.find({
        specialty: { $regex: analysis.specialty, $options: 'i' },
        isActive: true,
      })
        .select('name specialty image rating languages experience nextSlot consultationFee')
        .sort({ rating: -1 })
        .limit(3);
    } catch (e) {
      console.log('[quick-triage] Could not fetch doctors:', e.message);
    }

    res.status(200).json({
      ...analysis,
      matchingDoctors,
    });
  } catch (err) {
    console.error('[POST /chat/quick-triage]', err);
    res.status(500).json({ message: 'Triage failed.' });
  }
});

export default router;
