const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName:    { type: String, default: 'Royal Maltipoos' },
  logo:        { type: String, default: '' },
  contactEmail:{ type: String, default: '' },
  contactPhone:{ type: String, default: '' },
  address:     { type: String, default: '' },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook:  { type: String, default: '' },
    tiktok:    { type: String, default: '' }
  },
  // Contact links for the purchase modal (editable by super admin)
  whatsappLink:       { type: String, default: 'https://wa.me/1234567890' },
  facebookMessenger:  { type: String, default: 'https://m.me/royalmaltipoos' },
  emailNotifications: { type: Boolean, default: true },
  // Purchase inquiry log
  purchaseInquiries:  { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
