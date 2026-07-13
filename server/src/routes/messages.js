const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/messages - Get messages for current user (customer sees own, admin sees all or filtered)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent') {
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
        `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
        
        const assignedUserIds = assignedUserRows.map(row => row.user_id);
        
        const userId = req.query.user_id;
        if (userId) {
          if (!assignedUserIds.includes(parseInt(userId))) {
            return res.status(403).json({ error: 'Access denied. Client conversation not assigned to you.' });
          }
          const messages = await db.prepare(
            'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC'
          ).all(userId);
          return res.json(messages);
        }
        
        if (assignedUserIds.length === 0) {
          return res.json([]);
        }
        
        const placeholders = assignedUserIds.map(() => '?').join(',');
        const conversations = await db.prepare(`
          SELECT m.user_id, u.name, u.email, u.assigned_to, a.name as assigned_name, m.message as last_message, m.created_at as last_time,
            (SELECT COUNT(*) FROM messages WHERE user_id = m.user_id AND sender = 'customer' AND is_read = 0) as unread
          FROM messages m
          JOIN users u ON u.id = m.user_id
          LEFT JOIN users a ON u.assigned_to = a.id
          WHERE m.id IN (SELECT MAX(id) FROM messages GROUP BY user_id)
            AND m.user_id IN (${placeholders})
          ORDER BY m.created_at DESC
        `).all(...assignedUserIds);
        return res.json(conversations);
      }

      // Admin can filter by user_id query param, or get all unique conversations
      const userId = req.query.user_id;
      if (userId) {
        const messages = await db.prepare(
          'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC'
        ).all(userId);
        return res.json(messages);
      }
      // Return list of conversations (grouped by user_id with latest message)
      const conversations = await db.prepare(`
        SELECT m.user_id, u.name, u.email, u.assigned_to, a.name as assigned_name, m.message as last_message, m.created_at as last_time,
          (SELECT COUNT(*) FROM messages WHERE user_id = m.user_id AND sender = 'customer' AND is_read = 0) as unread
        FROM messages m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN users a ON u.assigned_to = a.id
        WHERE m.id IN (SELECT MAX(id) FROM messages GROUP BY user_id)
        ORDER BY m.created_at DESC
      `).all();
      return res.json(conversations);
    } else {
      const messages = await db.prepare(
        'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC'
      ).all(req.user.id);
      return res.json(messages);
    }
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages - Send a message
router.post('/', authenticate, async (req, res) => {
  const { message, user_id, attachment_url, attachment_name, attachment_type } = req.body;

  if ((!message || !message.trim()) && !attachment_url) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    let targetUserId, sender;

    if (req.user.role === 'admin') {
      // Admin sending to a specific customer
      if (!user_id) {
        return res.status(400).json({ error: 'user_id is required for admin messages.' });
      }
      targetUserId = user_id;
      sender = 'admin';
    } else {
      // Customer sending their own message
      targetUserId = req.user.id;
      sender = 'customer';
    }

    await db.prepare(
      'INSERT INTO messages (user_id, sender, message, attachment_url, attachment_name, attachment_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(targetUserId, sender, (message || '').trim(), attachment_url || null, attachment_name || null, attachment_type || null);

    const previewText = attachment_url ? `[Attachment: ${attachment_name || 'File'}]` : (message || '').trim().substring(0, 100);

    // Create a notification for the recipient
    if (sender === 'customer') {
      // Notify all admins
      const admins = await db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      for (const admin of admins) {
        await db.prepare(
          "INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'message', '/admin')"
        ).run(admin.id, `New message from ${req.user.name}`, previewText);
      }
    } else {
      // Notify customer
      await db.prepare(
        "INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'message', '/portal')"
      ).run(targetUserId, 'New message from Borderless Trips', previewText);
    }

    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// PUT /api/messages/read - Mark messages as read
router.put('/read', authenticate, async (req, res) => {
  const { user_id } = req.body;

  try {
    if (req.user.role === 'admin' && user_id) {
      // Admin marking customer messages as read
      await db.prepare("UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender = 'customer'").run(user_id);
    } else {
      // Customer marking admin messages as read
      await db.prepare("UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender = 'admin'").run(req.user.id);
    }
    res.json({ message: 'Messages marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
});

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    let count;
    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent') {
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
        `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);
        const assignedUserIds = assignedUserRows.map(row => row.user_id);
        if (assignedUserIds.length === 0) {
          count = 0;
        } else {
          const placeholders = assignedUserIds.map(() => '?').join(',');
          const countRow = await db.prepare(`
            SELECT COUNT(*) as count 
            FROM messages 
            WHERE sender = 'customer' AND is_read = 0 AND user_id IN (${placeholders})
          `).get(...assignedUserIds);
          count = countRow ? parseInt(countRow.count || '0') : 0;
        }
      } else {
        const countRow = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'customer' AND is_read = 0").get();
        count = countRow ? parseInt(countRow.count || '0') : 0;
      }
    } else {
      const countRow = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND sender = 'admin' AND is_read = 0").get(req.user.id);
      count = countRow ? parseInt(countRow.count || '0') : 0;
    }
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
});

module.exports = router;
