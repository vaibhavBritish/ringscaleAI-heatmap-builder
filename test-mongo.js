const { MongoClient } = require('mongodb');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const mongoUrlMatch = env.match(/MONGO_URL=(.*)/);
const url = mongoUrlMatch ? mongoUrlMatch[1].trim() : null;

async function testConnection() {
  if (!url) {
    console.error('MONGO_URL not found in .env');
    return;
  }
  
  console.log('Testing connection to:', url.replace(/:([^@]+)@/, ':****@'));
  const client = new MongoClient(url);
  try {
    await client.connect();
    console.log('Connection successful!');
    await client.close();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();
