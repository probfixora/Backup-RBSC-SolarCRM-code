const { createProxyMiddleware } = require('http-proxy-middleware');

// We must use the Node.js runtime instead of the Edge runtime 
// because http-proxy-middleware relies on Node APIs.
module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const proxy = createProxyMiddleware({
  target: (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim(),
  changeOrigin: true,
  pathRewrite: {
    '^/api/supabase': '', 
  },
  onProxyReq: (proxyReq, req, res) => {
    const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
    
    // Inject real Anon Key
    proxyReq.setHeader('apikey', anonKey);
    
    // Fix Authorization header
    const auth = req.headers['authorization'];
    if (!auth || auth.includes('hidden-key')) {
      proxyReq.setHeader('Authorization', `Bearer ${anonKey}`);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error');
  }
});

module.exports = function handler(req, res) {
  const target = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  if (!target) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL in server environment' });
  }

  // Ensure query parameters are not lost by http-proxy-middleware
  // (http-proxy-middleware handles it natively, but just to be sure)
  return proxy(req, res, (result) => {
    if (result instanceof Error) {
      throw result;
    }
    throw new Error(`Request '${req.url}' is not proxied!`);
  });
};
