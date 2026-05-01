import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// ─── Symptom Data (Ported from Backend) ────────────────────────────────────────

const symptomDatabase = [
  { keywords: ['chest pain', 'chest tightness', 'chest pressure'], specialty: 'Cardiologist', baseUrgency: 9, category: 'cardiac' },
  { keywords: ['heart attack', 'cardiac arrest'], specialty: 'Cardiologist', baseUrgency: 10, category: 'cardiac' },
  { keywords: ['palpitation', 'irregular heartbeat', 'heart racing', 'heart pounding'], specialty: 'Cardiologist', baseUrgency: 7, category: 'cardiac' },
  { keywords: ['shortness of breath', 'breathing difficulty', 'breathless', 'saans nahi aa rahi', 'saans phoolna'], specialty: 'Cardiologist', baseUrgency: 8, category: 'cardiac' },
  { keywords: ['high blood pressure', 'bp high', 'hypertension'], specialty: 'Cardiologist', baseUrgency: 6, category: 'cardiac' },
  { keywords: ['swollen feet', 'leg swelling', 'ankle swelling'], specialty: 'Cardiologist', baseUrgency: 5, category: 'cardiac' },
  { keywords: ['severe headache', 'worst headache', 'thunderclap headache'], specialty: 'Neurologist', baseUrgency: 8, category: 'neuro' },
  { keywords: ['seizure', 'convulsion', 'fit', 'epilepsy', 'mirgi'], specialty: 'Neurologist', baseUrgency: 9, category: 'neuro' },
  { keywords: ['stroke', 'face drooping', 'arm weakness', 'speech difficulty', 'lakwa'], specialty: 'Neurologist', baseUrgency: 10, category: 'neuro' },
  { keywords: ['headache', 'migraine', 'sir dard', 'sar dard'], specialty: 'Neurologist', baseUrgency: 4, category: 'neuro' },
  { keywords: ['dizziness', 'vertigo', 'chakkar', 'balance problem'], specialty: 'Neurologist', baseUrgency: 5, category: 'neuro' },
  { keywords: ['numbness', 'tingling', 'pins and needles', 'jhunjhuni'], specialty: 'Neurologist', baseUrgency: 5, category: 'neuro' },
  { keywords: ['memory loss', 'confusion', 'forgetfulness', 'bhoolna'], specialty: 'Neurologist', baseUrgency: 6, category: 'neuro' },
  { keywords: ['cancer', 'tumor', 'tumour', 'malignant'], specialty: 'Oncologist', baseUrgency: 8, category: 'oncology' },
  { keywords: ['lump', 'mass', 'growth', 'swelling that grows', 'gaanth'], specialty: 'Oncologist', baseUrgency: 7, category: 'oncology' },
  { keywords: ['unexplained weight loss', 'rapid weight loss'], specialty: 'Oncologist', baseUrgency: 7, category: 'oncology' },
  { keywords: ['skin rash', 'rash', 'daad', 'khaj', 'kharish'], specialty: 'Dermatologist', baseUrgency: 3, category: 'skin' },
  { keywords: ['acne', 'pimple', 'muhase'], specialty: 'Dermatologist', baseUrgency: 2, category: 'skin' },
  { keywords: ['eczema', 'psoriasis', 'skin infection', 'fungal'], specialty: 'Dermatologist', baseUrgency: 4, category: 'skin' },
  { keywords: ['hair loss', 'baal jharna', 'ganjapan'], specialty: 'Dermatologist', baseUrgency: 2, category: 'skin' },
  { keywords: ['fracture', 'broken bone', 'haddi toota'], specialty: 'Orthopedist', baseUrgency: 8, category: 'ortho' },
  { keywords: ['knee pain', 'joint pain', 'ghutne mein dard', 'jod dard'], specialty: 'Orthopedist', baseUrgency: 4, category: 'ortho' },
  { keywords: ['back pain', 'kamar dard', 'spine pain', 'slip disc'], specialty: 'Orthopedist', baseUrgency: 5, category: 'ortho' },
  { keywords: ['shoulder pain', 'neck pain', 'gardan dard'], specialty: 'Orthopedist', baseUrgency: 4, category: 'ortho' },
  { keywords: ['severe stomach pain', 'appendix', 'appendicitis'], specialty: 'Gastroenterologist', baseUrgency: 8, category: 'gastro' },
  { keywords: ['blood in stool', 'blood vomit', 'khoon ki ulti'], specialty: 'Gastroenterologist', baseUrgency: 9, category: 'gastro' },
  { keywords: ['stomach pain', 'abdomen pain', 'pet dard', 'pet mein dard'], specialty: 'Gastroenterologist', baseUrgency: 5, category: 'gastro' },
  { keywords: ['acidity', 'acid reflux', 'heartburn', 'seene mein jalan'], specialty: 'Gastroenterologist', baseUrgency: 3, category: 'gastro' },
  { keywords: ['constipation', 'kabz', 'diarrhea', 'dast', 'loose motion'], specialty: 'Gastroenterologist', baseUrgency: 3, category: 'gastro' },
  { keywords: ['liver', 'jaundice', 'piliya', 'hepatitis'], specialty: 'Gastroenterologist', baseUrgency: 7, category: 'gastro' },
  { keywords: ['vomiting', 'nausea', 'ulti', 'ji machlana'], specialty: 'Gastroenterologist', baseUrgency: 4, category: 'gastro' },
  { keywords: ['asthma', 'dama', 'wheezing', 'bronchitis'], specialty: 'Pulmonologist', baseUrgency: 6, category: 'pulmo' },
  { keywords: ['cough with blood', 'khoon wali khansi'], specialty: 'Pulmonologist', baseUrgency: 9, category: 'pulmo' },
  { keywords: ['chronic cough', 'persistent cough', 'purani khansi'], specialty: 'Pulmonologist', baseUrgency: 4, category: 'pulmo' },
  { keywords: ['tuberculosis', 'tb', 'lung infection'], specialty: 'Pulmonologist', baseUrgency: 7, category: 'pulmo' },
  { keywords: ['diabetes', 'sugar', 'madhumeh'], specialty: 'Endocrinologist', baseUrgency: 5, category: 'endo' },
  { keywords: ['thyroid', 'thyroxine', 'goiter'], specialty: 'Endocrinologist', baseUrgency: 4, category: 'endo' },
  { keywords: ['sudden vision loss', 'blind', 'dikhai nahi de raha'], specialty: 'Ophthalmologist', baseUrgency: 9, category: 'eye' },
  { keywords: ['ear pain', 'hearing loss', 'kaan dard'], specialty: 'ENT Specialist', baseUrgency: 4, category: 'ent' },
  { keywords: ['depression', 'anxiety', 'panic attack', 'suicidal'], specialty: 'Psychiatrist', baseUrgency: 7, category: 'psych' },
  { keywords: ['fever', 'bukhar', 'cold', 'sardi', 'cough', 'khansi'], specialty: 'General Physician', baseUrgency: 3, category: 'general' },
];

const urgencyModifiers = [
  { keywords: ['sudden', 'achanak', 'just now', 'abhi abhi'], modifier: 2 },
  { keywords: ['severe', 'terrible', 'unbearable', 'bahut zyada', 'very bad'], modifier: 2 },
  { keywords: ['mild', 'thoda', 'halka'], modifier: -1 },
];

// ─── Analysis Logic ───────────────────────────────────────────────────────────

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
  default: [
    'How long have you been experiencing this?',
    'On a scale of 1-10, how would you rate the discomfort?',
    'Do you have any other symptoms along with this?',
  ],
};

import { GoogleGenAI, Type } from "@google/genai";

/**
 * Intelligent symptom analysis using Gemini AI
 */
const runGeminiTriage = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("MCP: Missing GEMINI_API_KEY");
    return {
      specialty: "General Physician",
      urgencyScore: 5,
      matchedKeywords: [],
      recommendation: "⚠️ GEMINI_API_KEY missing in MCP environment. Falling back to basic triage.",
      followUpQuestions: ["Can you describe the pain in more detail?"]
    };
  }

  try {
    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze these patient symptoms and provide a structured triage assessment. Symptoms: "${text}"`;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            specialty: { type: Type.STRING },
            urgencyScore: { type: Type.INTEGER },
            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING },
            clinicalReasoning: { type: Type.STRING },
            followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["specialty", "urgencyScore", "matchedKeywords", "recommendation", "clinicalReasoning", "followUpQuestions"]
        }
      }
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini MCP Triage failed:", error);
    return {
      specialty: "General Physician",
      urgencyScore: 3,
      matchedKeywords: [],
      recommendation: "I'm having trouble analyzing this right now. Please consult a doctor.",
      followUpQuestions: []
    };
  }
};

// ─── MCP Server Initialization ───────────────────────────────────────────────

const server = new Server(
  {
    name: "duckteer-triage-superpower",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "triage_symptoms",
        description: "Analyze patient symptoms to determine urgency and recommended medical specialty. This tool is a 'Superpower' for rural healthcare triage, supporting Indian languages (transliterated) and providing clinical follow-up questions.",
        inputSchema: {
          type: "object",
          properties: {
            symptoms: {
              type: "string",
              description: "The patient's described symptoms (e.g., 'chest pain and sweating' or 'mujhe sar dard hai')",
            },
          },
          required: ["symptoms"],
        },
      },
      {
        name: "get_patient_records_fhir",
        description: "Retrieve patient medical history, conditions, and lab results in HL7 FHIR format. Uses SHARP context (PatientID and FHIR Token) to ensure data interoperability.",
        inputSchema: {
          type: "object",
          properties: {
            sharpPatientId: {
              type: "string",
              description: "The unique SHARP patient identifier (e.g., 'MED2026000001')",
            },
            fhirToken: {
              type: "string",
              description: "The SHARP-provided FHIR session token for authenticated data access.",
            },
          },
          required: ["sharpPatientId"],
        },
      },
      {
        name: "find_doctors_by_specialty",
        description: "Find available super-specialists for a given medical specialty. Essential for connecting Tier 2/3 patients with specialists.",
        inputSchema: {
          type: "object",
          properties: {
            specialty: {
              type: "string",
              description: "The medical specialty to search for (e.g., 'Cardiologist')",
            },
          },
          required: ["specialty"],
        },
      },
    ],
  };
});

/**
 * Handle tool execution.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "triage_symptoms") {
    const { symptoms } = z.object({ symptoms: z.string() }).parse(request.params.arguments);
    const analysis = await runGeminiTriage(symptoms);

    return {
      content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }],
    };
  }

  if (request.params.name === "find_doctors_by_specialty") {
    const { specialty } = z.object({ specialty: z.string() }).parse(request.params.arguments);
    
    const API_BASE = process.env.API_BASE || "http://localhost:5000/api";
    
    try {
      const response = await fetch(`${API_BASE}/doctors?specialty=${encodeURIComponent(specialty)}`);
      if (response.ok) {
        const doctors = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(doctors, null, 2) }],
        };
      }
    } catch (err) {
      console.error("Doctor fetch error:", err.message);
    }

    // Mock Doctors (Fallback)
    const mockDoctors = [
      { name: "Dr. Arvind Sharma", specialty: specialty, rating: 4.9, experience: "15 years", fee: 599 },
      { name: "Dr. Meera Iyer", specialty: specialty, rating: 4.8, experience: "12 years", fee: 499 }
    ];

    return {
      content: [{ type: "text", text: JSON.stringify(mockDoctors, null, 2) }],
    };
  }

  if (request.params.name === "get_patient_records_fhir") {
    const { sharpPatientId, fhirToken } = z.object({ 
      sharpPatientId: z.string(),
      fhirToken: z.string().optional()
    }).parse(request.params.arguments);
    
    const API_BASE = process.env.API_BASE || "http://localhost:5000/api";
    const AUTH_TOKEN = fhirToken || process.env.AUTH_TOKEN;

    if (AUTH_TOKEN) {
      try {
        const response = await fetch(`${API_BASE}/fhir/Everything`, {
          headers: {
            "Authorization": `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const fhirData = await response.json();
          return {
            content: [{ type: "text", text: JSON.stringify(fhirData, null, 2) }],
          };
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
      }
    }

    // Mock FHIR Bundle (Fallback if no token or fetch fails)
    const fhirBundle = {
      resourceType: "Bundle",
      type: "searchset",
      total: 2,
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: sharpPatientId,
            name: [{ family: "Patient", given: ["Demo (Mock)"] }],
            gender: "male",
            birthDate: "1990-01-01"
          }
        },
        {
          resource: {
            resourceType: "Condition",
            id: "cond-1",
            subject: { reference: `Patient/${sharpPatientId}` },
            code: {
              coding: [{ system: "http://snomed.info/sct", code: "38341003", display: "Hypertension" }]
            },
            clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] }
          }
        }
      ]
    };

    return {
      content: [{ type: "text", text: JSON.stringify(fhirBundle, null, 2) }],
    };
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Duckteer Triage MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
