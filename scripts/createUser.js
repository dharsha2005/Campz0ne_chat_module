/**
 * CLI helper to create a user with email/password
 * Usage: node scripts/createUser.js email@example.com password Username
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const User = require('../models/User');

async function main() {
  const [,, email, password, name, role, collegeId] = process.argv;
  if (!email || !password || !name) {
    console.error('Usage: node scripts/createUser.js email@example.com password "Full Name" [role] [collegeId]');
    console.error('  role: student|faculty|hod|admin (default: student)');
    process.exit(1);
  }

  const mongo = process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat';
  await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.error('User with that email already exists:', email);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    const userObj = {
      userId,
      name: name,
      email,
      passwordHash,
      role: role || 'student'
    };
    if (collegeId) userObj.collegeId = collegeId;

    // If role is not admin, ensure collegeId is provided
    if (userObj.role !== 'admin' && !userObj.collegeId) {
      console.error('For non-admin users, collegeId is required. Provide it as the 5th argument.');
      process.exit(1);
    }

    const user = new User(userObj);
    await user.save();

    console.log('User created:', { userId, name, email, role: userObj.role, collegeId: userObj.collegeId });
    process.exit(0);
  } catch (err) {
    console.error('Error creating user:', err);
    process.exit(1);
  }
}

main();
