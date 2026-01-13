const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone-chat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const College = require('./models/College');

const collegeData = {
  collegeId: 'COLL_' + Date.now().toString(36).toUpperCase(),
  name: 'Kongu Engineering College',
  code: 'KEC',
  type: 'engineering',
  establishedYear: 1998,
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
  isActive: true
};

async function addCollege() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connection.once('open', () => {
      console.log('✅ Connected to MongoDB');
    });
    
    console.log('Adding Kongu Engineering College...');
    
    const college = new College(collegeData);
    const savedCollege = await college.save();
    
    console.log('✅ Kongu Engineering College added successfully!');
    console.log('📋 College Details:');
    console.log('   ID:', savedCollege._id);
    console.log('   Name:', savedCollege.name);
    console.log('   Code:', savedCollege.code);
    console.log('   Type:', savedCollege.type);
    console.log('   Established:', savedCollege.establishedYear);
    console.log('   Address:', savedCollege.address.street + ', ' + savedCollege.address.city + ', ' + savedCollege.address.state);
    console.log('   Phone:', savedCollege.contact.phone);
    console.log('   Email:', savedCollege.contact.email);
    console.log('   Website:', savedCollege.contact.website);
    
    console.log('\n🎯 College is now available in the registration dropdown!');
    
  } catch (error) {
    console.error('❌ Error adding college:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

addCollege();
