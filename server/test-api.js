const http = require('http');

console.log('Testing Borderless Trips Backend API...');

const req = http.get('http://localhost:3001/api/packages', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('✅ API packages endpoint responded successfully.');
      try {
        const pkgs = JSON.parse(data);
        console.log(`✅ Received ${pkgs.length} packages from DB.`);
        console.log('Package Titles:', pkgs.map(p => p.title));
      } catch (err) {
        console.error('❌ Failed to parse JSON:', err.message);
      }
    } else {
      console.error(`❌ Unexpected status code: ${res.statusCode}`);
      console.log('Response:', data);
    }
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error('❌ Request failed:', err.message);
  process.exit(1);
});
