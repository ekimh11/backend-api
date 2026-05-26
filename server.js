require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// ── Middleware ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/pets',    require('./routes/pets'));
app.use('/api/orders',  require('./routes/orders'));
app.use('/api/cart',    require('./routes/cart'));
app.use('/api/admins',  require('./routes/admins'));
app.use('/api/payments',require('./routes/payments'));
app.use('/api/settings',require('./routes/settings'));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Royal Maltipoos API is running 🐾' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ── Database & Start ──
const PORT = process.env.PORT || 10000;

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });