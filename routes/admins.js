const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pet = require('../models/Pet');
const Order = require('../models/Order');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/admins — super_admin only
router.get('/', protect, restrictTo('super_admin'), async (req, res) => {
  const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).sort('-createdAt');
  res.json({ success: true, admins });
});

// POST /api/admins — create admin (super_admin only)
router.post('/', protect, restrictTo('super_admin'), async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ success: false, message: 'Email already in use.' });

  const admin = await User.create({
    name, email, password,
    role: role || 'admin',
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, admin });
});

// PUT /api/admins/:id — update admin (super_admin only)
router.put('/:id', protect, restrictTo('super_admin'), async (req, res) => {
  const { name, email, role } = req.body;
  const admin = await User.findByIdAndUpdate(req.params.id, { name, email, role }, { new: true });
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
  res.json({ success: true, admin });
});

// PATCH /api/admins/:id/suspend — toggle suspend
router.patch('/:id/suspend', protect, restrictTo('super_admin'), async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
  if (admin.role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot suspend super admin.' });

  admin.isActive = !admin.isActive;
  await admin.save();
  res.json({ success: true, admin });
});

// DELETE /api/admins/:id — delete admin (super_admin only)
router.delete('/:id', protect, restrictTo('super_admin'), async (req, res) => {
  const admin = await User.findById(req.params.id);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
  if (admin.role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot delete super admin.' });

  await admin.deleteOne();
  res.json({ success: true, message: 'Admin deleted.' });
});

// GET /api/admins/:id/activity
router.get('/:id/activity', protect, restrictTo('super_admin'), async (req, res) => {
  const [petsListed, ordersHandled, revenueData] = await Promise.all([
    Pet.countDocuments({ uploadedBy: req.params.id }),
    Order.countDocuments({ handledBy: req.params.id }),
    Order.aggregate([
      { $match: { handledBy: require('mongoose').Types.ObjectId(req.params.id), paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);
  res.json({ success: true, activity: { petsListed, ordersHandled, revenue: revenueData[0]?.total || 0 } });
});

module.exports = router;
