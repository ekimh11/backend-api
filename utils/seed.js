require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Settings = require('../models/Settings');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/royal_maltipoos';

const petData = [
  { name: 'Bella',  age: '8 weeks',  gender: 'Female', color: 'Cream',         weight: '1.2 lbs', price: 2800, isVaccinated: true,  healthStatus: 'Excellent', stock: 1, isFeatured: true,  description: 'Bella is a stunning cream-coated Maltipoo with the sweetest temperament. She loves cuddles and is great with children.', images: ['https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600'] },
  { name: 'Oliver', age: '10 weeks', gender: 'Male',   color: 'White',          weight: '1.4 lbs', price: 2600, isVaccinated: true,  healthStatus: 'Excellent', stock: 1, isFeatured: true,  description: 'Oliver is a playful white Maltipoo who loves to explore. Energetic, intelligent and easy to train.', images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'] },
  { name: 'Luna',   age: '9 weeks',  gender: 'Female', color: 'Apricot',        weight: '1.1 lbs', price: 3200, isVaccinated: true,  healthStatus: 'Excellent', stock: 1, isFeatured: true,  description: 'Luna is a rare apricot Maltipoo with gorgeous wavy fur. Calm, loving and perfect for apartment living.', images: ['https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600'] },
  { name: 'Max',    age: '12 weeks', gender: 'Male',   color: 'Silver',         weight: '1.6 lbs', price: 2400, isVaccinated: false, healthStatus: 'Good',      stock: 1, isFeatured: false, description: 'Max is a silver Maltipoo with a bold personality. Lively and loves to play fetch.', images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600'] },
  { name: 'Coco',   age: '7 weeks',  gender: 'Female', color: 'Brown',          weight: '1.0 lbs', price: 3000, isVaccinated: true,  healthStatus: 'Excellent', stock: 0, isFeatured: false, description: 'Coco is a chocolate brown beauty — already reserved. Check back for future litter siblings.', images: ['https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600'] },
  { name: 'Duke',   age: '11 weeks', gender: 'Male',   color: 'Cream & White',  weight: '1.5 lbs', price: 2700, isVaccinated: true,  healthStatus: 'Excellent', stock: 1, isFeatured: true,  description: 'Duke is a two-toned cream and white Maltipoo with a regal presence. Gentle, calm and hypoallergenic.', images: ['https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=600'] },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  // Clear data
  await User.deleteMany({});
  await Pet.deleteMany({});
  await Settings.deleteMany({});

  // Super Admin (full access)
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@royalmaltipoos.com',
    password: 'Admin@123',
    role: 'super_admin',
    isActive: true
  });
  console.log('✅ Super Admin: superadmin@royalmaltipoos.com / Admin@123');

  // Regular Admin
  await User.create({
    name: 'Jane Admin',
    email: 'admin@royalmaltipoos.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
    createdBy: superAdmin._id
  });
  console.log('✅ Admin:       admin@royalmaltipoos.com / Admin@123');

  // Pets
  for (const p of petData) {
    await Pet.create({ ...p, species: 'Dog', breed: 'Maltipoo', uploadedBy: superAdmin._id });
  }
  console.log(`✅ ${petData.length} pet listings created`);

  // Settings with placeholder contact links
  await Settings.create({
    shopName: 'Royal Maltipoos',
    contactEmail: 'hello@royalmaltipoos.com',
    contactPhone: '+1 (555) 123-4567',
    address: '789 Luxury Lane, Beverly Hills, CA 90210',
    whatsappLink: 'https://wa.me/1234567890',
    facebookMessenger: 'https://m.me/royalmaltipoos',
    purchaseInquiries: 0
  });
  console.log('✅ Settings initialized (update WhatsApp & Facebook links in Admin → Settings)');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Admin Credentials:');
  console.log('   Super Admin: superadmin@royalmaltipoos.com / Admin@123');
  console.log('   Admin:       admin@royalmaltipoos.com / Admin@123');
  console.log('\n🔗 Admin Login URL: http://localhost:3000/admin');
  console.log('⚠️  This URL is NOT linked from the public website — keep it private.');

  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
