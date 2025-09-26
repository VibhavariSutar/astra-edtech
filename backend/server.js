import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { setupSocket } from './socket/socketHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

const app = express();
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', // local development
  process.env.CLIENT_URL   // deployed frontend
].filter(Boolean);         // remove undefined if CLIENT_URL is missing

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      console.error('Blocked CORS request from origin:', origin);
      return callback(new Error('CORS policy: Not allowed'), false);
    }

    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io setup with same CORS
const io = new Server(httpServer, { cors: corsOptions });
setupSocket(io);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/quizzes', quizRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Astralearn API is running!',
    version: '1.0.0',
    database: 'MongoDB Atlas'
  });
});

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    msg: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Start server function
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
      console.log(`🗄️  Database: MongoDB Atlas`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  httpServer.close(() => process.exit(1));
});

startServer();
