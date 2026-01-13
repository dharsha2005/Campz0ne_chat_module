const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function updateUserRole() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage: node scripts/updateUserRole.js <email> <role>');
      console.log('Example: node scripts/updateUserRole.js admin@example.com admin');
      console.log('Valid roles: student, faculty, admin');
      process.exit(1);
    }

    const email = args[0].toLowerCase();
    const role = args[1].toLowerCase();

    if (!['student', 'faculty', 'admin'].includes(role)) {
      console.error('❌ Invalid role. Must be one of: student, faculty, admin');
      process.exit(1);
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.log('\nAvailable users:');
      const allUsers = await User.find({});
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - Role: ${u.role || 'student'}`);
      });
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Current role: ${user.role || 'student'}`);
    console.log(`   Updating role to: ${role}`);

    // Update role
    user.role = role;
    await user.save();

    console.log(`\n✅ Success! User role updated to: ${role}`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   New role: ${user.role}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserRole();

