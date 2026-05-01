# Agents Assemble Hackathon: Strategy & Roadmap

## Overview
Duckteer is pivoting to meet the requirements of the **"Agents Assemble: The Healthcare AI Endgame Challenge"**. We will demonstrate how a specialized triage engine for Tier 2/3 cities can be integrated into the Prompt Opinion ecosystem using **MCP** and **A2A** standards.

## Hackathon Objectives
- **Option 1: Build a Superpower (MCP)**: Expose the Duckteer Triage Engine as an MCP server.
- **Option 2: Build an Agent (Powered by A2A)**: Configure Duckteer as a collaborative agent within the Prompt Opinion platform.
- **Interoperability**: Implement **FHIR** data structures and **SHARP** context propagation.

## Current Gaps vs. Requirements

| Requirement | Current State | Action Item | Status |
| :--- | :--- | :--- | :--- |
| **MCP Server** | Fully Functional | Gemini-powered triage + FHIR tools | 🟢 Complete |
| **A2A Integration** | Agent Profile Created | Defined `agent-profile.json` + Handover logic | 🟢 Complete |
| **FHIR Support** | FHIR Adapter & MCP Tool | Implemented Patient/Observation/Condition resources | 🟢 Complete |
| **SHARP Specs** | Full Implementation | Added PatientID context + SHARP Headers | 🟢 Complete |
| **Prompt Opinion** | Prep Complete | Drafted Registration Description | 🟢 Complete |

## Roadmap (May 1 - May 11)

### Phase 1: The Superpower (MCP) — [Days 1-3]
- [x] Initialize MCP server project (`mcp-server/`).
- [x] Wrap `analyzeSymptoms` logic into an MCP tool: `triage_symptoms` (now Gemini-powered).
- [x] Add tool: `find_doctors_by_specialty` (connected to our DB).
- [x] Add tool: `get_patient_records_fhir` (FHIR compliant).
- [x] Verify MCP server with an MCP inspector.

### Phase 2: Interoperability (FHIR & SHARP) — [Days 4-6]
- [x] Create FHIR adapter layer in `backend/src/adapters/fhir.js`.
- [x] Convert `MedicalRecord` model to FHIR `Observation` and `Condition`.
- [x] Update `mcp-server` to fetch real FHIR data from backend.
- [x] Update `mcp-server` to accept SHARP context (PatientID).
- [ ] (Optional) Integrate with a public FHIR sandbox (e.g., HAPI FHIR).

### Phase 3: The Superhero (A2A Agent) — [Days 7-9]
- [ ] Define Duckteer's Agent personality and instructions.
- [ ] Implement A2A communication patterns (handling multi-agent calls).
- [ ] Ensure Duckteer can "hand off" to a Booking Agent or Pharmacy Agent.

### Phase 4: Integration & Submission — [Day 10-11]
- [ ] Register on Prompt Opinion Marketplace.
- [ ] Deploy backend/MCP server (Render/Vercel).
- [ ] Record 3-minute demo video.
- [ ] Final submission.

## Technical Stack Expansion
- **MCP Framework**: `@modelcontextprotocol/sdk`
- **FHIR Library**: `fhir.js` or manual JSON mapping.
- **Agent Orchestration**: Prompt Opinion platform tools.
