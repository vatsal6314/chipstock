const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const billRoutes = require('./routes/billRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Database connection middleware (connects or reuses connection)
app.use(async (req, res, next) => {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
    }
    next();
  } catch (err) {
    console.error('Database connection error in request middleware:', err.message);
    // Don't crash health check or login page if DB is temporarily connecting
    if (req.path === '/api/health') {
      return res.status(503).json({ success: false, message: 'Database disconnected', error: err.message });
    }
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please check your MONGODB_URI configuration.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
