const express = require('express');
const router = express.Router();
const path = require('path');
const Pet = require('../models/Pet');
const { protect, restrictTo } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// GET /api/pets — public, with filters
router.get('/', async (req, res) => {
  const { species, minPrice, maxPrice, gender, vaccinated, search, featured, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (species) filter.species = species;
  if (gender)  filter.gender = gender;
  if (vaccinated !== undefined) filter.isVaccinated = vaccinated === 'true';
  if (featured === 'true') filter.isFeatured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { breed: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [pets, total] = await Promise.all([
    Pet.find(filter).populate('uploadedBy', 'name email').sort('-createdAt').skip(skip).limit(Number(limit)),
    Pet.countDocuments(filter)
  ]);

  res.json({ success: true, pets, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/pets/featured
router.get('/featured', async (req, res) => {
  const pets = await Pet.find({ isFeatured: true, available: true }).limit(6);
  res.json({ success: true, pets });
});

// GET /api/pets/:id
router.get('/:id', async (req, res) => {
  const pet = await Pet.findById(req.params.id).populate('uploadedBy', 'name email');
  if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });
  res.json({ success: true, pet });
});

// POST /api/pets — admin only
router.post('/', protect, restrictTo('admin', 'super_admin'), upload.array('images', 5), async (req, res) => {
  try {
    const { name, breed, species, age, weight, price, description, gender, color, isVaccinated, healthStatus, stock, isFeatured } = req.body;
    const images = req.files ? req.files.map(f => '/uploads/' + path.basename(f.path)) : [];

    const pet = await Pet.create({
      name, breed, species, age, weight, price: Number(price),
      description, gender, color, isVaccinated: isVaccinated === 'true',
      healthStatus, stock: Number(stock) || 1,
      isFeatured: isFeatured === 'true', images,
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, pet });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({ success: false, message: 'Failed to create pet listing.' });
  }
});

// PUT /api/pets/:id — admin/super_admin
router.put('/:id', protect, restrictTo('admin', 'super_admin'), upload.array('images', 5), async (req, res) => {
  try {
    let pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });

    // Regular admin can only edit their own listings
    if (req.user.role === 'admin' && pet.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own listings.' });
    }

    const updates = { ...req.body };
    if (updates.price)    updates.price    = Number(updates.price);
    if (updates.stock)    updates.stock    = Number(updates.stock);
    if (updates.isVaccinated !== undefined) updates.isVaccinated = updates.isVaccinated === 'true';
    if (updates.isFeatured   !== undefined) updates.isFeatured   = updates.isFeatured   === 'true';
    if (updates.available    !== undefined) updates.available    = updates.available    === 'true';
    if (req.files && req.files.length > 0)  updates.images = req.files.map(f => '/uploads/' + path.basename(f.path));

    pet = await Pet.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, pet });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({ success: false, message: 'Failed to update pet listing.' });
  }
});

// DELETE /api/pets/:id
router.delete('/:id', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });

  if (req.user.role === 'admin' && pet.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only delete your own listings.' });
  }

  await pet.deleteOne();
  res.json({ success: true, message: 'Pet listing deleted.' });
});

// PATCH /api/pets/:id/toggle-featured — super_admin only
router.patch('/:id/toggle-featured', protect, restrictTo('super_admin'), async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  if (!pet) return res.status(404).json({ success: false, message: 'Pet not found.' });
  pet.isFeatured = !pet.isFeatured;
  await pet.save();
  res.json({ success: true, pet });
});

module.exports = router;
