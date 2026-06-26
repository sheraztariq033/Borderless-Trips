const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// POST /api/newsletter/subscribe - Subscribe to newsletter
router.post('/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(200).json({ message: 'You are already subscribed to our newsletter!' });
    }

    db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(email.toLowerCase());
    res.status(201).json({ message: 'Thank you for subscribing to our newsletter!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to subscribe.' });
  }
});

// GET /api/newsletter/subscribers - Get list of subscribers (Admin Only)
router.get('/subscribers', authenticate, adminOnly, (req, res) => {
  try {
    const subscribers = db.prepare('SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC').all();
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve subscribers.' });
  }
});

module.exports = router;
