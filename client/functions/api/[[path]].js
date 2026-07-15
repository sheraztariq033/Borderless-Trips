export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Retrieve target backend hostname from Cloudflare Pages Environment variables
  // Fallback to default workers.dev subdomain if not explicitly configured in Cloudflare Pages dashboard
  const backendWorkerHost = context.env.BACKEND_WORKER_URL || 'borderless-backend.lastlook-pk.workers.dev';
  
  // Clean prefix and construct target URL
  const cleanHost = backendWorkerHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const targetUrl = new URL(url.pathname + url.search, `https://${cleanHost}`);
  
  // Forward request to backend Worker (preserving method, headers, and body streams)
  try {
    return await fetch(targetUrl.toString(), context.request);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend proxy error', message: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
