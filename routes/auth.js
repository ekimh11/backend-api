const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/token');
const { protect, restrictTo } = require('../middleware/auth');

// ─── ADMIN-ONLY AUTH ───────────────────────────────────────────────────────
// POST /api/auth/admin-login  (the ONLY public auth endpoint)
// Basic in-memory rate limiting: max 10 attempts per IP per 15 min
const loginAttempts = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const window = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;
  if (!loginAttempts.has(ip)) loginAttempts.set(ip, []);
  const attempts = loginAttempts.get(ip).filter(t => now - t < window);
  if (attempts.length >= maxAttempts) {
    return res.status(429).json({ success: false, message: 'Too many login attempts. Please wait 15 minutes.' });
  }
  attempts.push(now);
  loginAttempts.set(ip, attempts);
  next();
};

router.post('/admin-login', rateLimit, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
  const user = await User.findOne({ email, role: { $in: ['admin', 'super_admin'] } }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
  if (!user.isActive) return res.status(401).json({ success: false, message: 'Account suspended. Contact support.' });
  res.json({ success: true, token: generateToken(user._id), user });
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/update-profile  (admin updating own profile)
router.put('/update-profile', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
  res.json({ success: true, user });
});

// PUT /api/auth/change-password
router.put('/change-password', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = router;
