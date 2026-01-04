const http = require('http');

const collegeData = {
  name: "Kongu Engineering College",
  code: "KEC",
  type: "engineering",
  establishedYear: 1998,
  address: "Perundurai, Erode, Tamil Nadu 638052, India",
  contact: {
    phone: "+91-424-2550250",
    email: "info@kongu.ac.in",
    website: "https://kongu.ac.in"
  }
};

const postData = JSON.stringify(collegeData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/colleges',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✅ Kongu Engineering College added successfully!');
        console.log('College ID:', response.data._id);
        console.log('College Name:', response.data.name);
      } else {
        console.log('❌ Error:', response.error);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(postData);
req.end();
