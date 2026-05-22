const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    petId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    petName:  String,
    price:    Number,
    quantity: { type: Number, default: 1 }
  }],
  totalAmount:      { type: Number, required: true },
  paymentStatus:    { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
  paymentReference: { type: String, default: '' },
  paymentMethod:    { type: String, default: 'stripe' },
  deliveryMethod:   { type: String, enum: ['home_delivery', 'in_store_pickup'], default: 'home_delivery' },
  deliveryAddress:  { type: String, default: '' },
  customerInfo: {
    name:    String,
    email:   String,
    phone:   String
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  orderRef:  { type: String, unique: true }
}, { timestamps: true });

// Generate order reference
orderSchema.pre('save', function(next) {
  if (!this.orderRef) {
    this.orderRef = 'RM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
