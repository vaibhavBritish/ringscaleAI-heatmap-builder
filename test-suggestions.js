require('dotenv').config();
const { getQuerySuggestions } = require('./lib/google-places');

async function test() {
  console.log('Testing query autocomplete for "immigration"...');
  console.log('Using API Key:', process.env.GOOGLE_API_KEY ? 'Present' : 'MISSING');
  try {
    const results = await getQuerySuggestions('immigration');
    console.log('Results:', JSON.stringify(results, null, 2));
    if (results.length === 0) {
      console.log('WARNING: No results returned.');
    } else {
      console.log('SUCCESS: Suggestions working!');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

test();
