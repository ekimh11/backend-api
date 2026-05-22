const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Pet = require('../models/Pet');
const Cart = require('../models/Cart');
const { protect, restrictTo } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../utils/email');

// POST /api/orders — create order (customer)
router.post('/', protect, async (req, res) => {
  const { items, deliveryMethod, deliveryAddress, customerInfo, paymentReference } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'No items in order.' });

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const pet = await Pet.findById(item.petId);
    if (!pet) return res.status(404).json({ success: false, message: `Pet ${item.petId} not found.` });
    if (pet.stock < 1) return res.status(400).json({ success: false, message: `${pet.name} is sold out.` });

    totalAmount += pet.price * (item.quantity || 1);
    orderItems.push({ petId: pet._id, petName: pet.name, price: pet.price, quantity: item.quantity || 1 });

    // Decrease stock
    pet.stock -= (item.quantity || 1);
    await pet.save();
  }

  const order = await Order.create({
    customerId: req.user._id,
    items: orderItems,
    totalAmount,
    paymentStatus: paymentReference ? 'paid' : 'pending',
    paymentReference: paymentReference || '',
    deliveryMethod,
    deliveryAddress,
    customerInfo: customerInfo || { name: req.user.name, email: req.user.email, phone: req.user.phone }
  });

  // Clear cart
  await Cart.findOneAndDelete({ customerId: req.user._id });

  // Send email
  try { await sendOrderConfirmation(order); } catch(e) { /* silent */ }

  res.status(201).json({ success: true, order });
});

// GET /api/orders/my — customer's own orders
router.get('/my', protect, async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id }).sort('-createdAt');
  res.json({ success: true, orders });
});

// GET /api/orders — admin gets orders (filtered by role)
router.get('/', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (req.user.role === 'admin') filter.handledBy = req.user._id;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'name email phone')
      .sort('-createdAt').skip(skip).limit(Number(limit)),
    Order.countDocuments(filter)
  ]);

  res.json({ success: true, orders, total });
});

// GET /api/orders/stats — admin dashboard stats
router.get('/stats', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  const matchFilter = req.user.role === 'admin' ? { handledBy: req.user._id } : {};
  const today = new Date(); today.setHours(0,0,0,0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalOrders, todayOrders, monthOrders, revenue, pendingOrders] = await Promise.all([
    Order.countDocuments(matchFilter),
    Order.countDocuments({ ...matchFilter, createdAt: { $gte: today } }),
    Order.countDocuments({ ...matchFilter, createdAt: { $gte: monthStart } }),
    Order.aggregate([{ $match: { ...matchFilter, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.countDocuments({ ...matchFilter, orderStatus: 'pending' })
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders, todayOrders, monthOrders,
      revenue: revenue[0]?.total || 0,
      pendingOrders
    }
  });
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customerId', 'name email phone');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/status — admin updates order status
router.patch('/:id/status', protect, restrictTo('admin', 'super_admin'), async (req, res) => {
  const { orderStatus } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus, handledBy: req.user._id },
    { new: true }
  );
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  res.json({ success: true, order });
});

module.exports = router;
