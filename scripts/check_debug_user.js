
const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat');
    console.log('MongoDB Connected');

    const userId = '494750f6-ce59-4896-8bc9-ddde899b1960';
    const user = await User.findOne({ userId });
    console.log('User found:', user);

    const colleges = await College.find({});
    console.log('Colleges count:', colleges.length);
    if (colleges.length > 0) {
      console.log('First college:', colleges[0]);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
