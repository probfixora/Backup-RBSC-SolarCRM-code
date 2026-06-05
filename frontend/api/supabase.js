const { createProxyMiddleware } = require('http-proxy-middleware');

// We must use the Node.js runtime instead of the Edge runtime 
// because http-proxy-middleware relies on Node APIs.
module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

module.exports = function handler(req, res) {
  const target = (process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

  if (!target || !anonKey) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY in Vercel environment' });
  }

  const proxy = createProxyMiddleware({
    target: target,
    changeOrigin: true,
    pathRewrite: {
      '^/api/supabase': '', 
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('apikey', anonKey);
      
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

  return proxy(req, res, (result) => {
    if (result instanceof Error) {
      throw result;
    }
    throw new Error(`Request '${req.url}' is not proxied!`);
  });
};
