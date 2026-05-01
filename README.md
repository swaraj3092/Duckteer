# Duckteer - AI-Powered Healthcare Triage

Duckteer is an advanced, AI-driven telemedicine platform designed to connect patients in Tier 2 and Tier 3 cities with super-specialists. It features a specialized triage engine, FHIR-compliant data management, and interoperability via the Model Context Protocol (MCP).

## 🚀 Overview

Duckteer solves the "last-mile" healthcare challenge by providing:
- **AI Symptom Triage**: Gemini-powered analysis to categorize patient urgency.
- **MCP Integration**: Exposing medical tools as standardized Model Context Protocol services.
- **FHIR Compliance**: Standardized health data exchange using Patient, Observation, and Condition resources.
- **Telemedicine Suite**: Real-time consultation and doctor discovery.

## 📂 Project Structure

This repository is organized as a monorepo:

- **`/frontend`**: React-based dashboard and patient interface (Vite).
- **`/backend`**: Express.js server handling data, FHIR adapters, and AI logic.
- **`/mcp-server`**: Dedicated MCP server for exposing Duckteer tools to AI agents.
- **`/docs`**: Project documentation and architecture details.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Motion, Recharts.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io.
- **AI**: Google Gemini Pro (via `@google/genai`).
- **Standardization**: MCP SDK, FHIR, SHARP context propagation.

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance
- Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/duckteer.git
   cd duckteer
   ```

2. Install dependencies for each service:
   ```bash
   # Root (if using workspaces)
   npm install

   # Or individually
   cd frontend && npm install
   cd ../backend && npm install
   cd ../mcp-server && npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `backend/` directory based on `.env.example`.

4. Run the development servers:
   ```bash
   # Backend
   cd backend && npm run dev

   # Frontend
   cd frontend && npm run dev
   ```

## 🌐 Deployment

Duckteer is designed to be deployed on **Vercel** or **Render**.

### Vercel Deployment
1. Import the repository into Vercel.
2. Configure the Root Directory if deploying a specific service, or use Vercel Monorepo settings.
3. Add environment variables in the Vercel Dashboard.

---

*Developed for the "Agents Assemble: The Healthcare AI Endgame Challenge"*
