const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');

// GET /api/cart
router.get('/', protect, async (req, res) => {
  const cart = await Cart.findOne({ customerId: req.user._id }).populate('items.petId');
  res.json({ success: true, cart: cart || { items: [] } });
});

// POST /api/cart/add
router.post('/add', protect, async (req, res) => {
  const { petId, quantity = 1 } = req.body;
  let cart = await Cart.findOne({ customerId: req.user._id });

  if (!cart) {
    cart = await Cart.create({ customerId: req.user._id, items: [{ petId, quantity }] });
  } else {
    const existingItem = cart.items.find(i => i.petId.toString() === petId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ petId, quantity });
    }
    await cart.save();
  }

  await cart.populate('items.petId');
  res.json({ success: true, cart });
});

// PUT /api/cart/update
router.put('/update', protect, async (req, res) => {
  const { petId, quantity } = req.body;
  const cart = await Cart.findOne({ customerId: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

  const item = cart.items.find(i => i.petId.toString() === petId);
  if (item) {
    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.petId.toString() !== petId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
  }

  await cart.populate('items.petId');
  res.json({ success: true, cart });
});

// DELETE /api/cart/remove/:petId
router.delete('/remove/:petId', protect, async (req, res) => {
  const cart = await Cart.findOne({ customerId: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

  cart.items = cart.items.filter(i => i.petId.toString() !== req.params.petId);
  await cart.save();
  await cart.populate('items.petId');
  res.json({ success: true, cart });
});

// DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res) => {
  await Cart.findOneAndDelete({ customerId: req.user._id });
  res.json({ success: true, message: 'Cart cleared.' });
});

module.exports = router;
