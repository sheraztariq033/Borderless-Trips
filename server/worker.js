import { httpServerHandler } from 'cloudflare:node';
import app from './src/app.js';
import { runDailyChecks } from './src/utils/cron.js';

export default {
  async fetch(request, env, ctx) {
    // Adapter wraps Express app into a Cloudflare HTTP listener
    const handler = httpServerHandler(app);
    return handler.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    console.log('⏰ Triggered daily cron checks from Cloudflare scheduler...');
    ctx.waitUntil(runDailyChecks());
  }
};
