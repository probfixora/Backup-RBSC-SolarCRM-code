/**
 * Cloudflare Pages Function: /api/supabase/[[path]]
 *
 * Proxies ALL /api/supabase/* requests (including nested paths like
 * /api/supabase/auth/v1/token) to the real Supabase project,
 * injecting the API key server-side so it is never exposed to the browser.
 *
 * ─── Setup in Cloudflare Pages Dashboard ──────────────────────────────────────
 * Pages → Your Project → Settings → Environment Variables → Add:
 *   SUPABASE_URL      = https://rgipmrviqapxxilsiclm.supabase.co
 *   SUPABASE_ANON_KEY = <your real anon key>
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function onRequest(context) {
  const { request, env } = context;

  const supabaseUrl = (env.SUPABASE_URL || '').trim();
  const anonKey     = (env.SUPABASE_ANON_KEY || '').trim();

  // Guard: env vars must be set in Cloudflare dashboard
  if (!supabaseUrl || !anonKey) {
    return new Response(
      JSON.stringify({
        error: 'Server misconfiguration: SUPABASE_URL or SUPABASE_ANON_KEY missing from Cloudflare environment variables.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Build the upstream Supabase URL
  const incomingUrl = new URL(request.url);
  // Strip the /api/supabase prefix; everything after it goes to Supabase
  const strippedPath = incomingUrl.pathname.replace(/^\/api\/supabase/, '');
  const targetUrl    = `${supabaseUrl}${strippedPath}${incomingUrl.search}`;

  // Clone and patch request headers
  const headers = new Headers(request.headers);
  headers.delete('host');             // Never forward the original host
  headers.set('apikey', anonKey);     // Supabase requires the apikey header

  // Replace the dummy placeholder key with the real anon key
  const existingAuth = headers.get('authorization') || '';
  if (!existingAuth || existingAuth.includes('hidden-key')) {
    headers.set('authorization', `Bearer ${anonKey}`);
  }

  // Forward the request upstream
  const upstreamRes = await fetch(targetUrl, {
    method:  request.method,
    headers: headers,
    body:    ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    duplex:  'half', // required for streaming bodies in Workers/Pages
  });

  // Strip hop-by-hop headers that must not be forwarded
  const resHeaders = new Headers(upstreamRes.headers);
  ['transfer-encoding', 'content-encoding', 'content-length', 'connection'].forEach(h =>
    resHeaders.delete(h)
  );

  return new Response(upstreamRes.body, {
    status:  upstreamRes.status,
    headers: resHeaders,
  });
}
