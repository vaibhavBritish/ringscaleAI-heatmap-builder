const https = require('https');
require('dotenv').config({ path: '.env' });

const data = JSON.stringify({
  textQuery: 'pizza',
  maxResultCount: 2
});

const options = {
  hostname: 'places.googleapis.com',
  port: 443,
  path: '/v1/places:searchText',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
    'X-Goog-FieldMask': 'places.id',
    'Referer': 'https://ringscale.ai/',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('HTTPS STATUS:', res.statusCode, '\nBODY:', body));
});

req.on('error', error => console.error('Error:', error));
req.write(data);
req.end();
