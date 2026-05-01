/**
 * FHIR Adapter for Duckteer
 * Maps internal MongoDB models to HL7 FHIR R4 standard.
 */

/**
 * Maps a User model to a FHIR Patient resource.
 */
export const mapUserToPatient = (user) => {
  return {
    resourceType: "Patient",
    id: user.patientId || user._id.toString(),
    identifier: [
      {
        system: "http://duckteer.com/patients",
        value: user.patientId || user._id.toString(),
      },
      {
        system: "tel",
        value: user.phone,
      },
    ],
    name: [
      {
        text: user.name,
        family: user.name.split(" ").pop(),
        given: [user.name.split(" ")[0]],
      },
    ],
    gender: user.gender ? user.gender.toLowerCase() : "unknown",
    birthDate: user.age ? `${new Date().getFullYear() - user.age}-01-01` : undefined, // Approximation
    address: [
      {
        city: user.city,
      },
    ],
  };
};

/**
 * Maps a MedicalRecord model to a FHIR Observation/Condition resource.
 */
export const mapRecordToFhir = (record) => {
  return {
    resourceType: "DiagnosticReport",
    id: record._id.toString(),
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0074",
            code: "GE",
            display: "General",
          },
        ],
      },
    ],
    code: {
      text: record.specialty,
    },
    subject: {
      reference: `Patient/${record.patient.toString()}`,
    },
    effectiveDateTime: new Date(record.createdAt).toISOString(),
    issued: new Date(record.createdAt).toISOString(),
    performer: [
      {
        display: record.doctorName,
      },
    ],
    conclusion: record.diagnosis,
    conclusionCode: [
      {
        text: record.diagnosis,
      },
    ],
    presentedForm: record.uploadedDocuments.map((doc) => ({
      contentType: doc.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
      url: doc.url,
      title: doc.name,
    })),
  };
};

/**
 * Wraps resources into a FHIR Bundle.
 */
export const createFhirBundle = (resources) => {
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: resources.length,
    entry: resources.map((r) => ({
      fullUrl: `http://api.duckteer.com/fhir/${r.resourceType}/${r.id}`,
      resource: r,
    })),
  };
};
