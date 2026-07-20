// Import file system polyfills first to intercept all subsequent module imports
import './fs-polyfill.js';

// Set global polyfill for __dirname before importing any CommonJS modules
globalThis.__dirname = globalThis.__dirname || '';

import { httpServerHandler } from 'cloudflare:node';
import { createServer } from 'node:http';
import { runDailyChecks } from './src/utils/cron.js';

// Load Express app dynamically to ensure global polyfills are applied first
const app = require('./src/app.js');

// Create native Node.js HTTP Server wrapper for Express app
const server = createServer(app);

// Bind mock server to port 3001 (required for httpServerHandler to map it)
server.listen(3001);

// Create the official Cloudflare Workers HTTP Server adapter handler
const handler = httpServerHandler(server);

// Wrap handler.fetch to dynamically populate process.env from Cloudflare Workers bindings (env)
const originalFetch = handler.fetch;
handler.fetch = async function(request, env, ctx) {
  const url = new URL(request.url);
  const uploadsMatch = url.pathname.match(/^\/uploads\/([^\/]+)$/);
  
  // Edge Fast-Path: stream uploaded files natively from R2 directly with caching headers
  if (request.method === 'GET' && uploadsMatch && env && env.R2_BUCKET) {
    const filename = uploadsMatch[1];
    try {
      const object = await env.R2_BUCKET.get(filename);
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Content-Length', object.size.toString());
        // Enable aggressive browser and CDN caching
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        
        return new Response(object.body, {
          status: 200,
          headers
        });
      }
    } catch (err) {
      console.warn(`⚠️ Edge fast-path fetch failed for ${filename}:`, err.message);
    }
  }

  if (env && typeof env === 'object') {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') {
        process.env[key] = value;
      } else if (value && typeof value === 'object' && typeof value.put === 'function') {
        globalThis[key] = value;
      }
    }
  }
  return originalFetch.call(this, request, env, ctx);
};

// Attach scheduled cron triggers directly to the default export object
handler.scheduled = async (event, env, ctx) => {
  console.log('⏰ Triggered daily cron checks from Cloudflare scheduler...');
  
  // Populate process.env for cron checks too!
  if (env && typeof env === 'object') {
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === 'string') {
        process.env[key] = value;
      } else if (value && typeof value === 'object' && typeof value.put === 'function') {
        globalThis[key] = value;
      }
    }
  }
  
  ctx.waitUntil(runDailyChecks());
};

export default handler;
