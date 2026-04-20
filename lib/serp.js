import axios from 'axios';

export async function searchGoogleResults(query, options = {}) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_API_KEY missing in environment variables');
  }

  const {
    location = 'United States',
    gl = 'us',
    hl = 'en',
    num = 10,
  } = options;

  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: query,
        location,
        google_domain: 'google.com',
        gl,
        hl,
        num,
        api_key: apiKey,
      },
    });

    return response.data?.organic_results || [];
  } catch (error) {
    const status = error?.response?.status || 500;
    const providerMessage = error?.response?.data?.error || 'SerpApi request failed';
    const wrappedError = new Error(providerMessage);
    wrappedError.name = 'SerpApiError';
    wrappedError.status = status;
    wrappedError.providerMessage = providerMessage;
    throw wrappedError;
  }
}

export async function fetchSerpRankings(keyword, businessUrl, location = 'United States') {
  try {
    const organicResults = await searchGoogleResults(keyword, { location });
    
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
    console.error('Error fetching SerpApi rankings:', error?.message || error);
    throw error;
  }
}
