const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, adminOnly, (req, res) => {
  try {
    const isAgent = req.user.sub_role === 'agent';
    const agentId = req.user.id;

    const totalBookings = isAgent 
      ? db.prepare('SELECT COUNT(*) as c FROM bookings WHERE assigned_to = ?').get(agentId).c 
      : db.prepare('SELECT COUNT(*) as c FROM bookings').get().c;
      
    const confirmedBookings = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed' AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'confirmed'").get().c;
      
    const completedBookings = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'completed' AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM bookings WHERE status = 'completed'").get().c;
      
    const revenue = isAgent 
      ? db.prepare("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid' AND assigned_to = ?").get(agentId).r 
      : db.prepare("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid'").get().r;
      
    const totalCustomers = isAgent 
      ? db.prepare(`
          SELECT COUNT(DISTINCT user_id) as c FROM (
            SELECT user_id FROM bookings WHERE assigned_to = ? AND user_id IS NOT NULL
            UNION
            SELECT user_id FROM visa_applications WHERE assigned_to = ? AND user_id IS NOT NULL
            UNION
            SELECT user_id FROM flight_requests WHERE assigned_to = ? AND user_id IS NOT NULL
            UNION
            SELECT user_id FROM service_requests WHERE assigned_to = ? AND user_id IS NOT NULL
          )
        `).get(agentId, agentId, agentId, agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
      
    const activeInquiries = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM inquiries WHERE status = 'new' AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM inquiries WHERE status = 'new'").get().c;
      
    const totalVisaApps = isAgent 
      ? db.prepare('SELECT COUNT(*) as c FROM visa_applications WHERE assigned_to = ?').get(agentId).c 
      : db.prepare('SELECT COUNT(*) as c FROM visa_applications').get().c;
      
    const pendingVisas = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM visa_applications WHERE status IN ('submitted', 'in_review') AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM visa_applications WHERE status IN ('submitted', 'in_review')").get().c;
      
    const totalServiceReqs = isAgent 
      ? db.prepare('SELECT COUNT(*) as c FROM service_requests WHERE assigned_to = ?').get(agentId).c 
      : db.prepare('SELECT COUNT(*) as c FROM service_requests').get().c;
      
    const newServiceReqs = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status = 'new' AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE status = 'new'").get().c;
      
    const totalFlightReqs = isAgent 
      ? db.prepare('SELECT COUNT(*) as c FROM flight_requests WHERE assigned_to = ?').get(agentId).c 
      : db.prepare('SELECT COUNT(*) as c FROM flight_requests').get().c;
      
    const subscribers = isAgent ? 0 : db.prepare('SELECT COUNT(*) as c FROM newsletter_subscribers').get().c;
    
    let unreadMsgs = 0;
    if (isAgent) {
      const assignedUserRows = db.prepare(`
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
        unreadMsgs = db.prepare(`
          SELECT COUNT(*) as c FROM messages 
          WHERE sender = 'customer' AND is_read = 0 AND user_id IN (${placeholders})
        `).get(...assignedUserIds).c;
      }
    } else {
      unreadMsgs = db.prepare("SELECT COUNT(*) as c FROM messages WHERE sender = 'customer' AND is_read = 0").get().c;
    }

    // This week stats
    const thisWeekBookings = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM bookings WHERE created_at >= DATE('now', '-7 days') AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM bookings WHERE created_at >= DATE('now', '-7 days')").get().c;
      
    const thisWeekRevenue = isAgent 
      ? db.prepare("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid' AND created_at >= DATE('now', '-7 days') AND assigned_to = ?").get(agentId).r 
      : db.prepare("SELECT COALESCE(SUM(total_price), 0) as r FROM bookings WHERE payment_status = 'paid' AND created_at >= DATE('now', '-7 days')").get().r;
      
    const thisWeekRequests = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE created_at >= DATE('now', '-7 days') AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE created_at >= DATE('now', '-7 days')").get().c;
      
    const todayRequests = isAgent 
      ? db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE DATE(created_at) = DATE('now') AND assigned_to = ?").get(agentId).c 
      : db.prepare("SELECT COUNT(*) as c FROM service_requests WHERE DATE(created_at) = DATE('now')").get().c;

    // Service request breakdown by type
    const reqByType = isAgent 
      ? db.prepare('SELECT service_type, COUNT(*) as count FROM service_requests WHERE assigned_to = ? GROUP BY service_type').all(agentId) 
      : db.prepare('SELECT service_type, COUNT(*) as count FROM service_requests GROUP BY service_type').all();

    // Booking status breakdown
    const bookingsByStatus = isAgent 
      ? db.prepare('SELECT status, COUNT(*) as count FROM bookings WHERE assigned_to = ? GROUP BY status').all(agentId) 
      : db.prepare('SELECT status, COUNT(*) as count FROM bookings GROUP BY status').all();

    // Recent activity (last 10 items across all tables)
    const recentBookings = isAgent 
      ? db.prepare("SELECT 'booking' as type, b.booking_ref as ref, b.customer_name as name, b.status, b.created_at, b.assigned_to, u.name as assigned_name FROM bookings b LEFT JOIN users u ON b.assigned_to = u.id WHERE b.assigned_to = ? ORDER BY b.created_at DESC LIMIT 5").all(agentId) 
      : db.prepare("SELECT 'booking' as type, b.booking_ref as ref, b.customer_name as name, b.status, b.created_at, b.assigned_to, u.name as assigned_name FROM bookings b LEFT JOIN users u ON b.assigned_to = u.id ORDER BY b.created_at DESC LIMIT 5").all();
      
    const recentVisas = isAgent 
      ? db.prepare("SELECT 'visa' as type, v.app_ref as ref, v.customer_name as name, v.status, v.created_at, v.assigned_to, u.name as assigned_name FROM visa_applications v LEFT JOIN users u ON v.assigned_to = u.id WHERE v.assigned_to = ? ORDER BY v.created_at DESC LIMIT 5").all(agentId) 
      : db.prepare("SELECT 'visa' as type, v.app_ref as ref, v.customer_name as name, v.status, v.created_at, v.assigned_to, u.name as assigned_name FROM visa_applications v LEFT JOIN users u ON v.assigned_to = u.id ORDER BY v.created_at DESC LIMIT 5").all();
      
    const recentRequests = isAgent 
      ? db.prepare("SELECT 'service_request' as type, s.ref, s.name, s.status, s.created_at, s.assigned_to, u.name as assigned_name FROM service_requests s LEFT JOIN users u ON s.assigned_to = u.id WHERE s.assigned_to = ? ORDER BY s.created_at DESC LIMIT 5").all(agentId) 
      : db.prepare("SELECT 'service_request' as type, s.ref, s.name, s.status, s.created_at, s.assigned_to, u.name as assigned_name FROM service_requests s LEFT JOIN users u ON s.assigned_to = u.id ORDER BY s.created_at DESC LIMIT 5").all();

    const recentActivity = [...recentBookings, ...recentVisas, ...recentRequests]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({
      kpis: {
        totalBookings, confirmedBookings, completedBookings, revenue,
        totalCustomers, activeInquiries, totalVisaApps, pendingVisas,
        totalServiceReqs, newServiceReqs, totalFlightReqs, subscribers, unreadMsgs
      },
      thisWeek: { bookings: thisWeekBookings, revenue: thisWeekRevenue, requests: thisWeekRequests, todayRequests },
      breakdowns: { reqByType, bookingsByStatus },
      recentActivity
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
});

// GET /api/analytics/settings - Get business settings
router.get('/settings', authenticate, adminOnly, (req, res) => {
  if (req.user.sub_role === 'agent') {
    return res.status(403).json({ error: 'Access denied. Administrator rights required.' });
  }
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// PUT /api/analytics/settings - Save business settings
router.put('/settings', authenticate, adminOnly, (req, res) => {
  if (req.user.sub_role === 'agent') {
    return res.status(403).json({ error: 'Access denied. Administrator rights required.' });
  }
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(req.body)) {
      stmt.run(key, String(value));
    }
    res.json({ message: 'Settings saved.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// GET /api/analytics/settings/public - Get public settings (no auth required)
router.get('/settings/public', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load public settings.' });
  }
});

module.exports = router;
