const { searchBusinessByText } = require('./lib/google-places');

async function test() {
  console.log('Testing business search for "immigration"...');
  try {
    const results = await searchBusinessByText('immigration');
    console.log('Results:', JSON.stringify(results.slice(0, 2), null, 2));
    if (results.length === 0) {
      console.log('WARNING: No businesses found.');
    } else {
      console.log('SUCCESS: API key and Business Search are working.');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

test();
