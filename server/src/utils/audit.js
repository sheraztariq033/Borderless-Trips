const db = require('../models/database');

async function logAudit(userId, action, details = {}) {
  try {
    await db.prepare('INSERT INTO audit_logs (user_id, action, details_json) VALUES (?, ?, ?)')
      .run(userId || null, action, JSON.stringify(details));
  } catch (err) {
    console.error('💥 Audit log error:', err.message);
  }
}

module.exports = { logAudit };
