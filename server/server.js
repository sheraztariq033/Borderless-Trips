const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');

const PORT = process.env.PORT || 3001;
const runMigrations = require('./migrate');
const { startScheduler } = require('./src/utils/cron');

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server launched successfully on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.100.75:${PORT}`);
  try {
    await runMigrations();
    startScheduler();
  } catch (err) {
    console.error('💥 Migrations/Scheduler failed on startup:', err.message);
  }
});
