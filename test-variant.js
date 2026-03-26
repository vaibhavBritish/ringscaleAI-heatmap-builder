const { MongoClient } = require('mongodb');

const url1 = "";
const url2 = ""; // No slash

async function test(url, label) {
  console.log(`Testing ${label}:`, url.replace(/:([^@]+)@/, ':****@'));
  const client = new MongoClient(url, { connectTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log(`${label} successful!`);
    await client.close();
  } catch (err) {
    console.log(`${label} failed:`, err.message);
  }
}

async function run() {
  await test(url1, "With Slash");
  await test(url2, "No Slash");
}

run();
