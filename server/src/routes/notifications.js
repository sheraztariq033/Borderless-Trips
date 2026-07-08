const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications - Get notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await db.prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const countRow = await db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
    ).get(req.user.id);
    const count = countRow ? parseInt(countRow.count || '0') : 0;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

// PUT /api/notifications/:id/read - Mark single as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

module.exports = router;
