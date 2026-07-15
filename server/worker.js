// Set global polyfill for __dirname before importing any CommonJS modules
// This prevents ReferenceErrors on Edge runtimes which do not support node filesystems
globalThis.__dirname = globalThis.__dirname || '';

import { httpServerHandler } from 'cloudflare:node';
import { runDailyChecks } from './src/utils/cron.js';

// Load application dynamically to ensure global polyfills are applied first
const app = require('./src/app.js');

export default {
  async fetch(request, env, ctx) {
    const handler = httpServerHandler(app);
    return handler.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    console.log('⏰ Triggered daily cron checks from Cloudflare scheduler...');
    ctx.waitUntil(runDailyChecks());
  }
};
