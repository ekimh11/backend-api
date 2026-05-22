const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  species:      { type: String, default: 'Dog' },
  breed:        { type: String, default: 'Maltipoo' },
  age:          { type: String, required: true },
  weight:       { type: String, default: '' },
  price:        { type: Number, required: true, min: 0 },
  description:  { type: String, default: '' },
  images:       [{ type: String }],
  gender:       { type: String, enum: ['Male', 'Female'], required: true },
  color:        { type: String, default: '' },
  isVaccinated: { type: Boolean, default: false },
  healthStatus: { type: String, default: 'Excellent' },
  stock:        { type: Number, default: 1, min: 0 },
  isFeatured:   { type: Boolean, default: false },
  available:    { type: Boolean, default: true },
  status:       { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Auto-mark as sold when stock reaches 0
petSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.status = 'sold';
    this.available = false;
  }
  next();
});

module.exports = mongoose.model('Pet', petSchema);
