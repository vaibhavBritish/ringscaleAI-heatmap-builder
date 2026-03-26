const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const url = process.env.MONGO_URL;
  console.log('Attempting to connect to MongoDB...');
  console.log('URL:', url.replace(/:([^@]+)@/, ':****@')); // Hide password

  const client = new MongoClient(url, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    const dbs = await client.db().admin().listDatabases();
    console.log('Databases:', dbs.databases.map(db => db.name));
  } catch (err) {
    console.error('Connection failed!');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.cause) {
      console.error('Cause Name:', err.cause.name);
      console.error('Cause Message:', err.cause.message);
    }
    console.log('\n--- Troubleshooting Tips ---');
    console.log('1. Check if your IP is whitelisted in MongoDB Atlas (Network Access).');
    console.log('2. Ensure "Allow access from anywhere" (0.0.0.0/0) is enabled for testing.');
    console.log('3. Verify your username and password are correct.');
  } finally {
    await client.close();
  }
}

testConnection();
