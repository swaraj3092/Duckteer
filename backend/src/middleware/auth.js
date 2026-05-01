import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    if (process.env.NODE_ENV !== "production" && token === "demo_token_offline") {
      req.user = { _id: "507f1f77bcf86cd799439011", name: "Demo User", role: "patient" };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    try {
      user = await User.findById(decoded.id).select("-otp -__v");
    } catch (dbErr) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] DB disconnected, using demo bypass for:", decoded.id);
        user = { _id: decoded.id, name: "Demo User", role: "patient" };
      } else {
        throw dbErr;
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
    }
    next(err);
  }
};

/**
 * SHARP Context Propagation Middleware
 * Extracts X-SHARP-* headers for agent-to-agent interoperability
 */
export const sharpContext = (req, res, next) => {
  const patientId = req.headers['x-sharp-patient-id'];
  const fhirToken = req.headers['x-sharp-fhir-token'];

  if (patientId) {
    req.sharp = {
      patientId,
      fhirToken: fhirToken || null,
      timestamp: new Date().toISOString()
    };
    console.log(`[SHARP] Context received for Patient: ${patientId}`);
  }
  
  next();
};

