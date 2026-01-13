
const mongoose = require('mongoose');
const User = require('../models/User');
const College = require('../models/College');
const UsersController = require('../controllers/usersController');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

// Mock response object
const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat');
    console.log('MongoDB Connected');

    // 1. Create a College
    const college = await College.findOneAndUpdate(
      { code: 'TEST_COL_FAC' },
      { 
        name: 'Test College Fac', 
        code: 'TEST_COL_FAC',
        type: 'engineering',
        email: 'testfac@college.com'
      },
      { upsert: true, new: true }
    );
    console.log('College created:', college._id);

    // 2. Create an HOD
    const hodId = uuidv4();
    const hod = await User.create({
        userId: hodId,
        name: 'Test HOD Fac',
        email: `hodfac_${Date.now()}@test.com`,
        role: 'hod',
        collegeId: String(college._id),
        departmentId: 'ECE'
    });
    console.log('HOD created:', hod.userId);

    // 3. Mock Request for createFaculty (WITHOUT collegeId)
    const req = {
      user: { userId: hod.userId, role: 'hod' },
      body: {
        name: 'Test Faculty',
        email: `faculty_${Date.now()}@test.com`,
        password: 'password123',
        departmentId: 'ECE', // Must match HOD
        // collegeId is MISSING intentionally
      }
    };

    const res = mockRes();

    console.log('Testing createFaculty with HOD user and NO collegeId in body...');
    await UsersController.createFaculty(req, res);

    if (res.statusCode === 201) {
      console.log('✅ Success! Faculty created.');
      console.log('Response data:', res.data);
      
      // Verify the faculty has the correct collegeId
      if (String(res.data.data.collegeId) === String(college._id)) {
        console.log('✅ College ID correctly inferred from HOD.');
      } else {
        console.error('❌ Wrong College ID:', res.data.data.collegeId);
      }
    } else {
      console.error('❌ Failed:', res.statusCode, res.data);
    }

    // Clean up
    await User.deleteOne({ _id: hod._id });
    if (res.data && res.data.data && res.data.data.userId) {
        await User.deleteOne({ userId: res.data.data.userId });
    }
    await College.deleteOne({ _id: college._id });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verify();
