import axios from 'axios';

export async function fetchSerpRankings(keyword, businessUrl, location = 'United States') {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY missing in environment variables');
  }

  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: keyword,
        location: location,
        google_domain: 'google.com',
        gl: 'us',
        hl: 'en',
        api_key: apiKey,
      },
    });

    const organicResults = response.data.organic_results || [];
    
    // Normalize business URL to find it in results
    const normalizedTarget = businessUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    
    const result = organicResults.find(r => 
      r.link.includes(normalizedTarget)
    );

    if (result) {
      return {
        rank: result.position,
        url: result.link,
        title: result.title,
        snippet: result.snippet,
      };
    }

    return { rank: null, msg: 'Not found in top results' };
  } catch (error) {
    console.error('Error fetching SerpApi rankings:', error);
    throw error;
  }
}
