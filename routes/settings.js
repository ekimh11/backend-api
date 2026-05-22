const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/settings — public (frontend reads whatsapp/facebook links)
router.get('/', async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({ success: true, settings });
});

// PUT /api/settings — super_admin only
router.put('/', protect, restrictTo('super_admin'), async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  Object.assign(settings, req.body);
  await settings.save();
  res.json({ success: true, settings });
});

// POST /api/settings/track-inquiry — public analytics
router.post('/track-inquiry', async (req, res) => {
  try {
    await Settings.findOneAndUpdate({}, { $inc: { purchaseInquiries: 1 } }, { upsert: true });
  } catch (e) {}
  res.json({ success: true });
});

module.exports = router;
