const fetch = require('node-fetch');

const API = 'http://localhost:3000/api';

async function run() {
  try {
    const cols = await fetch(`${API}/public/colleges`);
    const colData = await cols.json();
    console.log('Colleges:', colData.data && colData.data.length);
    const collegeId = (colData.data && colData.data[0] && colData.data[0]._id) || '';
    if (!collegeId) {
      console.error('No collegeId found to test registration');
      process.exit(1);
    }

    const payload = {
      name: 'Test Student',
      email: `test_student_${Date.now()}@example.com`,
      password: 'password123',
      role: 'student',
      departmentId: 'IT',
      collegeId,
      rollNo: '23ITR999'
    };

    console.log('Registering with payload:', payload);

    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
}

run();
