import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import medicalRecordRoutes from './routes/medicalRecords.js';
import chatRoutes from './routes/chat.js';
import fhirRoutes from './routes/fhir.js';
import { sharpContext } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ── Database Connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/duckteer';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.warn('⚠️ MongoDB connection failed:', err.message);
    console.warn('🚀 Continuing in DEMO MODE with bypass logic enabled.');
  });

// ── Socket.io (Video Call Signaling) ─────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Track rooms: roomId → Set of socket IDs
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Patient / Doctor joins a consultation room
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId).add(socket.id);

    // Notify other participant(s) in the room
    socket.to(roomId).emit('user-connected', userId);
    console.log(`📹 User ${userId} joined room ${roomId}`);
  });

  // WebRTC Signaling: forward offer / answer / ICE candidates between peers
  socket.on('signal', ({ roomId, data }) => {
    socket.to(roomId).emit('signal', { data });
  });

  // Simple in-call chat message
  socket.on('chat-message', ({ roomId, message }) => {
    socket.to(roomId).emit('chat-message', message);
  });

  socket.on('disconnect', () => {
    // Clean up rooms
    rooms.forEach((sockets, roomId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (sockets.size === 0) rooms.delete(roomId);
      }
    });
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Express Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.FRONTEND_URL || '').split(',');
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0 || process.env.FRONTEND_URL === '*') {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(sharpContext); // Enable SHARP context propagation
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/fhir', fhirRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Duckteer API — Telemedicine for Bharat',
    docs: 'https://github.com/swaraj3092/Duckteer',
    status: 'Live'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Duckteer API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred.',
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for video signaling`);
});
