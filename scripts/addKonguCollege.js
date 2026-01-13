const mongoose = require('mongoose');
require('dotenv').config();
const College = require('../models/College');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat';

async function connect() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function upsertKongu() {
  try {
    await connect();

    const collegeData = {
      collegeId: 'COLL_KEC',
      name: 'Kongu Engineering College',
      code: 'KEC',
      address: {
        street: 'Perundurai',
        city: 'Erode',
        state: 'Tamil Nadu',
        pincode: '638052',
        country: 'India'
      },
      contact: {
        phone: '+91-424-2550250',
        email: 'info@kongu.ac.in',
        website: 'https://kongu.ac.in'
      },
      type: 'engineering',
      establishedYear: 1998,
      isActive: true
    };

    const existing = await College.findOne({ code: collegeData.code });
    if (existing) {
      await College.findOneAndUpdate({ code: collegeData.code }, collegeData, { new: true });
      console.log('Updated existing Kongu Engineering College');
    } else {
      const created = new College(collegeData);
      await created.save();
      console.log('Inserted Kongu Engineering College');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error upserting Kongu college:', err);
    process.exit(1);
  }
}

upsertKongu();
