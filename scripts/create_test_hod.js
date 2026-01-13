
const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');
const AuthService = require('../services/authService');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createTestHod() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat');
    console.log('MongoDB Connected');

    // 1. Find the college (Kongu Engineering College)
    const college = await College.findOne({ code: 'KEC' });
    
    if (!college) {
      console.error('❌ Error: Could not find Kongu Engineering College (KEC). Please make sure seed data is run.');
      process.exit(1);
    }
    
    console.log(`Found College: ${college.name} (${college._id})`);

    // 2. Define HOD details
    const email = 'hod@kec.edu';
    const password = 'password123';
    const departmentId = 'CSE'; // Computer Science

    // 3. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
        console.log('⚠️ User already exists, updating...');
        // Update existing user to ensure they have the right role and college
        user.role = 'hod';
        user.collegeId = String(college._id);
        user.departmentId = departmentId;
        user.passwordHash = await AuthService.hashPassword(password);
        await user.save();
    } else {
        // Create new user
        console.log('Creating new HOD user...');
        const passwordHash = await AuthService.hashPassword(password);
        user = new User({
            userId: uuidv4(),
            name: 'KEC CSE HOD',
            email: email,
            passwordHash: passwordHash,
            role: 'hod',
            collegeId: String(college._id),
            departmentId: departmentId,
            isOnline: true
        });
        await user.save();
    }

    console.log('\n✅ HOD Account Ready!');
    console.log('--------------------------------------------------');
    console.log(`Email:      ${email}`);
    console.log(`Password:   ${password}`);
    console.log(`College:    ${college.name}`);
    console.log(`Department: ${departmentId}`);
    console.log('--------------------------------------------------');
    console.log('Use these credentials to login at the main page.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestHod();
