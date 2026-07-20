const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, adminOnly, async (req, res) => {
  try {
    const isAgent = req.user.sub_role === 'agent';
    const agentId = req.user.id;

    const runQuery = async (sql, ...params) => {
      const row = await db.prepare(sql).get(...params);
      return row ? parseFloat(row.c !== undefined ? row.c : (row.r !== undefined ? row.r : '0')) : 0;
    };

    const totalBookings = isAgent 
      ? await runQuery('SELECT COUNT(*) as c FROM bookings WHERE assigned_to = ?', agentId)
      : await runQuery('SELECT COUNT(*) as c FROM bookings');
      
    const confirmedBookings = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'");
      
    const completedBookings = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM bookings WHERE status = 'completed' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM bookings WHERE status = 'completed'");
      
    const revenue = isAgent 
      ? await runQuery("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid'");
      
    const totalCustomers = isAgent 
      ? await runQuery(`
          SELECT COUNT(DISTINCT user_id) as c FROM (
            SELECT user_id FROM bookings WHERE assigned_to = $1 AND user_id IS NOT NULL
            UNION
            SELECT user_id FROM visa_applications WHERE assigned_to = $2 AND user_id IS NOT NULL
            UNION
            SELECT user_id FROM flight_requests WHERE assigned_to = $3 AND user_id IS NOT NULL
            UNION
            SELECT user_id FROM service_requests WHERE assigned_to = $4 AND user_id IS NOT NULL
          ) tmp
        `, agentId, agentId, agentId, agentId)
      : await runQuery("SELECT COUNT(*) as c FROM users WHERE role = 'customer'");
      
    const activeInquiries = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM inquiries WHERE status = 'new' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM inquiries WHERE status = 'new'");
      
    const totalVisaApps = isAgent 
      ? await runQuery('SELECT COUNT(*) as c FROM visa_applications WHERE assigned_to = ?', agentId)
      : await runQuery('SELECT COUNT(*) as c FROM visa_applications');
      
    const pendingVisas = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM visa_applications WHERE status IN ('submitted', 'in_review') AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM visa_applications WHERE status IN ('submitted', 'in_review')");
      
    const totalServiceReqs = isAgent 
      ? await runQuery('SELECT COUNT(*) as c FROM service_requests WHERE assigned_to = ?', agentId)
      : await runQuery('SELECT COUNT(*) as c FROM service_requests');
      
    const newServiceReqs = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM service_requests WHERE status = 'new' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM service_requests WHERE status = 'new'");
      
    const totalFlightReqs = isAgent 
      ? await runQuery('SELECT COUNT(*) as c FROM flight_requests WHERE assigned_to = ?', agentId)
      : await runQuery('SELECT COUNT(*) as c FROM flight_requests');
      
    const subscribers = isAgent ? 0 : await runQuery('SELECT COUNT(*) as c FROM newsletter_subscribers');
    
    let unreadMsgs = 0;
    if (isAgent) {
      const assignedUserRows = await db.prepare(`
        SELECT DISTINCT id as user_id FROM users WHERE assigned_to = ?
        UNION
        SELECT DISTINCT user_id FROM visa_applications WHERE assigned_to = ? AND user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM bookings WHERE assigned_to = ? AND user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM flight_requests WHERE assigned_to = ? AND user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM service_requests WHERE assigned_to = ? AND user_id IS NOT NULL
      `).all(agentId, agentId, agentId, agentId, agentId);
      const assignedUserIds = assignedUserRows.map(row => row.user_id);
      if (assignedUserIds.length > 0) {
        const placeholders = assignedUserIds.map(() => '?').join(',');
        unreadMsgs = await runQuery(`
          SELECT COUNT(*) as c FROM messages 
          WHERE sender = 'customer' AND is_read = 0 AND user_id IN (${placeholders})
        `, ...assignedUserIds);
      }
    } else {
      unreadMsgs = await runQuery("SELECT COUNT(*) as c FROM messages WHERE sender = 'customer' AND is_read = 0");
    }

    // This week stats
    const thisWeekBookings = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM bookings WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM bookings WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'");
      
    const thisWeekRevenue = isAgent 
      ? await runQuery("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '7 days' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '7 days'");
      
    const thisWeekRequests = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM service_requests WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM service_requests WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'");
      
    const todayRequests = isAgent 
      ? await runQuery("SELECT COUNT(*) as c FROM service_requests WHERE created_at::date = CURRENT_DATE AND assigned_to = ?", agentId)
      : await runQuery("SELECT COUNT(*) as c FROM service_requests WHERE created_at::date = CURRENT_DATE");

    // Service request breakdown by type
    const reqByType = isAgent 
      ? await db.prepare('SELECT service_type, COUNT(*) as count FROM service_requests WHERE assigned_to = ? GROUP BY service_type').all(agentId) 
      : await db.prepare('SELECT service_type, COUNT(*) as count FROM service_requests GROUP BY service_type').all();

    // Booking status breakdown
    const bookingsByStatus = isAgent 
      ? await db.prepare('SELECT status, COUNT(*) as count FROM bookings WHERE assigned_to = ? GROUP BY status').all(agentId) 
      : await db.prepare('SELECT status, COUNT(*) as count FROM bookings GROUP BY status').all();

    // Recent activity (last 10 items across all tables)
    const recentBookings = isAgent 
      ? await db.prepare("SELECT 'booking' as type, b.booking_ref as ref, b.customer_name as name, b.status, b.created_at, b.assigned_to, u.name as assigned_name FROM bookings b LEFT JOIN users u ON b.assigned_to = u.id WHERE b.assigned_to = ? ORDER BY b.created_at DESC LIMIT 5").all(agentId) 
      : await db.prepare("SELECT 'booking' as type, b.booking_ref as ref, b.customer_name as name, b.status, b.created_at, b.assigned_to, u.name as assigned_name FROM bookings b LEFT JOIN users u ON b.assigned_to = u.id ORDER BY b.created_at DESC LIMIT 5").all();
      
    const recentVisas = isAgent 
      ? await db.prepare("SELECT 'visa' as type, v.app_ref as ref, v.customer_name as name, v.status, v.created_at, v.assigned_to, u.name as assigned_name FROM visa_applications v LEFT JOIN users u ON v.assigned_to = u.id WHERE v.assigned_to = ? ORDER BY v.created_at DESC LIMIT 5").all(agentId) 
      : await db.prepare("SELECT 'visa' as type, v.app_ref as ref, v.customer_name as name, v.status, v.created_at, v.assigned_to, u.name as assigned_name FROM visa_applications v LEFT JOIN users u ON v.assigned_to = u.id ORDER BY v.created_at DESC LIMIT 5").all();
      
    const recentRequests = isAgent 
      ? await db.prepare("SELECT 'service_request' as type, s.ref, s.name, s.status, s.created_at, s.assigned_to, u.name as assigned_name FROM service_requests s LEFT JOIN users u ON s.assigned_to = u.id WHERE s.assigned_to = ? ORDER BY s.created_at DESC LIMIT 5").all(agentId) 
      : await db.prepare("SELECT 'service_request' as type, s.ref, s.name, s.status, s.created_at, s.assigned_to, u.name as assigned_name FROM service_requests s LEFT JOIN users u ON s.assigned_to = u.id ORDER BY s.created_at DESC LIMIT 5").all();

    const recentActivity = [...recentBookings, ...recentVisas, ...recentRequests]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Calculate database size
    let dbSizeBytes = 0;
    try {
      const sizeResult = await db.prepare("SELECT pg_database_size(current_database()) as size").get();
      dbSizeBytes = sizeResult ? parseInt(sizeResult.size || '0') : 0;
    } catch (e) {
      console.error('Failed to get database size:', e);
    }

    // Calculate R2 size
    let r2SizeBytes = 0;
    let r2ObjectsCount = 0;
    let r2Configured = false;
    try {
      const { s3, BUCKET_NAME } = require('../utils/s3');
      const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
      if (process.env.R2_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID.startsWith('YOUR_')) {
        r2Configured = true;
        const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
        const response = await s3.send(command);
        if (response.Contents) {
          r2ObjectsCount = response.Contents.length;
          for (const item of response.Contents) {
            r2SizeBytes += item.Size;
          }
        }
      }
    } catch (e) {
      console.error('Failed to get R2 size:', e);
    }

    const totalUsers = await runQuery("SELECT COUNT(*) as c FROM users");

    const quotas = {
      db: {
        used: dbSizeBytes,
        limit: 500 * 1024 * 1024, // 500MB
        percentage: Math.min(100, Math.round((dbSizeBytes / (500 * 1024 * 1024)) * 100))
      },
      r2: {
        configured: r2Configured,
        used: r2SizeBytes,
        objectsCount: r2ObjectsCount,
        limit: 10 * 1024 * 1024 * 1024, // 10GB
        percentage: Math.min(100, Math.round((r2SizeBytes / (10 * 1024 * 1024 * 1024)) * 100))
      },
      auth: {
        used: totalUsers,
        limit: 50000,
        percentage: Math.min(100, Math.round((totalUsers / 50000) * 100))
      }
    };

    // Advanced Business Suite KPI Queries
    const monthlyRevenue = await db.prepare(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(total_price) as total
      FROM bookings 
      WHERE payment_status = 'paid' 
      GROUP BY month 
      ORDER BY month ASC
    `).all().catch(() => []);

    const wonCount = await runQuery("SELECT COUNT(*) as c FROM bookings WHERE status IN ('confirmed', 'completed')");
    const totalLeads = (await runQuery("SELECT COUNT(*) as c FROM inquiries")) + (await runQuery("SELECT COUNT(*) as c FROM service_requests"));
    const conversionRate = totalLeads > 0 ? parseFloat(((wonCount / totalLeads) * 100).toFixed(2)) : 0;

    const topCountries = await db.prepare(`
      SELECT country, COUNT(*) as count 
      FROM visa_applications 
      WHERE country IS NOT NULL AND country != '' 
      GROUP BY country 
      ORDER BY count DESC 
      LIMIT 5
    `).all().catch(() => []);

    const avgTimeResult = await db.prepare(`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_days
      FROM visa_applications
      WHERE status IN ('approved', 'visa_successful')
    `).get().catch(() => null);
    const avgVisaProcessingTime = avgTimeResult && avgTimeResult.avg_days ? parseFloat(parseFloat(avgTimeResult.avg_days).toFixed(1)) : 0;

    const surveyStatsResult = await db.prepare(`
      SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as total_responses
      FROM surveys
    `).get().catch(() => ({ avg_rating: 0, total_responses: 0 }));
    const surveyStats = {
      avgRating: parseFloat(parseFloat(surveyStatsResult.avg_rating || 0).toFixed(2)),
      totalResponses: parseInt(surveyStatsResult.total_responses || 0)
    };

    res.json({
      kpis: {
        totalBookings, confirmedBookings, completedBookings, revenue,
        totalCustomers, activeInquiries, totalVisaApps, pendingVisas,
        totalServiceReqs, newServiceReqs, totalFlightReqs, subscribers, unreadMsgs,
        conversionRate, avgVisaProcessingTime
      },
      thisWeek: { bookings: thisWeekBookings, revenue: thisWeekRevenue, requests: thisWeekRequests, todayRequests },
      breakdowns: { reqByType, bookingsByStatus, monthlyRevenue, topCountries, surveyStats },
      recentActivity,
      quotas
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

// GET /api/analytics/settings - Get business settings
router.get('/settings', authenticate, adminOnly, async (req, res) => {
  if (req.user.sub_role === 'agent') {
    return res.status(403).json({ error: 'Access denied. Administrator rights required.' });
  }
  try {
    const rows = await db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// PUT /api/analytics/settings - Save business settings
router.put('/settings', authenticate, adminOnly, async (req, res) => {
  if (req.user.sub_role === 'agent') {
    return res.status(403).json({ error: 'Access denied. Administrator rights required.' });
  }
  try {
    const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value');
    for (const [key, value] of Object.entries(req.body)) {
      await stmt.run(key, String(value));
    }
    res.json({ message: 'Settings saved.' });
  } catch (error) {
    console.error('💥 Failed to save settings error:', error);
    res.status(500).json({ error: 'Failed to save settings: ' + error.message });
  }
});

// GET /api/analytics/settings/public - Get public settings (no auth required)
router.get('/settings/public', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load public settings.' });
  }
});

// GET /api/analytics/audit-logs - Get audit logs (Admin Only)
router.get('/audit-logs', authenticate, adminOnly, async (req, res) => {
  try {
    const logs = await db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

module.exports = router;
