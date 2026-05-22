const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

let stripe;
try { stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); } catch(e) {}

// POST /api/payments/create-intent
router.post('/create-intent', protect, async (req, res) => {
  if (!stripe) return res.status(503).json({ success: false, message: 'Payment service not configured.' });
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      metadata: { userId: req.user._id.toString() }
    });
    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/payments/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.sendStatus(200);
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'payment_intent.succeeded') {
    const { Order } = require('../models/Order');
    const pi = event.data.object;
    await Order.findOneAndUpdate({ paymentReference: pi.id }, { paymentStatus: 'paid' });
  }
  res.sendStatus(200);
});

module.exports = router;
