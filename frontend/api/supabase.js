module.exports = async function handler(req, res) {
  try {
    const target = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim();
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

    if (!target || !anonKey) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in Vercel environment' });
    }

    // Get the path after /api/supabase
    const pathAndQuery = req.url.replace(/^\/api\/supabase/, '');
    const targetUrl = `${target}${pathAndQuery}`;

    // Prepare headers
    const fetchHeaders = new Headers();
    for (const key in req.headers) {
      const lowerKey = key.toLowerCase();
      // Skip host and headers that can cause fetch issues
      if (!['host', 'connection', 'content-length', 'accept-encoding'].includes(lowerKey)) {
        fetchHeaders.set(key, req.headers[key]);
      }
    }

    // Inject Anon Key
    fetchHeaders.set('apikey', anonKey);

    // Fix Authorization header
    const auth = fetchHeaders.get('authorization');
    if (!auth || auth.includes('hidden-key')) {
      fetchHeaders.set('authorization', `Bearer ${anonKey}`);
    }

    // Prepare fetch options
    const options = {
      method: req.method,
      headers: fetchHeaders,
    };

    // Vercel automatically parses JSON bodies into req.body
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const response = await fetch(targetUrl, options);

    // Forward response status and headers
    res.status(response.status);
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Avoid chunked encoding issues, and don't copy content-encoding 
      // because native fetch automatically decompresses the body.
      if (!['transfer-encoding', 'content-encoding', 'content-length'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    });

    // Forward response body as buffer to support all content types
    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error('Fetch Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
