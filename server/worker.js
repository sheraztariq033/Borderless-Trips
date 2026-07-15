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

// Attach scheduled cron triggers directly to the default export object
handler.scheduled = async (event, env, ctx) => {
  console.log('⏰ Triggered daily cron checks from Cloudflare scheduler...');
  ctx.waitUntil(runDailyChecks());
};

export default handler;
