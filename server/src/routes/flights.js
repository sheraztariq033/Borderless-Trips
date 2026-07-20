const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// POST /api/flights/request - Create a flight request
router.post('/request', async (req, res) => {
  const { fromCity, toCity, departDate, returnDate, passengers, flightClass, tripType, name, email, phone } = req.body;

  let userId = null;
  let customerName = name || '';
  let customerEmail = email || '';
  let customerPhone = phone || '';
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      const user = await db.prepare('SELECT name, email, phone FROM users WHERE id = ?').get(userId);
      if (user) {
        customerName = customerName || user.name;
        customerEmail = customerEmail || user.email;
        customerPhone = customerPhone || user.phone;
      }
    } catch (e) { /* guest request */ }
  }

  if (!fromCity || !toCity || !departDate || !passengers) {
    return res.status(400).json({ error: 'Origin, destination, departure date, and passengers are required.' });
  }

  try {
    let autoCreated = false;
    let tempPassword = '';
    let token = '';
    let userExists = false;
    const emailLower = customerEmail.toLowerCase().trim();

    if (!userId && emailLower) {
      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
      if (existing) {
        userId = existing.id;
        userExists = true;
      } else {
        // Auto-create customer user
        const { hashPassword } = require('../utils/crypto');
        tempPassword = 'welcome123';
        const hash = hashPassword(tempPassword);
        const result = await db.prepare(
          'INSERT INTO users (name, email, password_hash, phone, role, sub_role) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(customerName || 'Flight Customer', emailLower, hash, customerPhone || '', 'customer', '');
        userId = result.lastInsertRowid;
        autoCreated = true;

        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        token = jwt.sign({ id: userId, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      }
    }

    await db.prepare(`
      INSERT INTO flight_requests (user_id, customer_name, customer_email, customer_phone, from_city, to_city, depart_date, return_date, passengers, class, trip_type, status, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', '')
    `).run(userId, customerName, emailLower, customerPhone, fromCity, toCity, departDate, returnDate || null, parseInt(passengers) || 1, flightClass || 'economy', tripType || 'return');

    res.status(201).json({
      message: 'Flight quote request submitted successfully.',
      autoCreated,
      email: emailLower,
      tempPassword,
      token,
      userExists
    });
  } catch (error) {
    console.error('Create flight request error:', error);
    res.status(500).json({ error: 'Failed to save flight request.' });
  }
});

// GET /api/flights/requests - Get all requests (Admin Only)
router.get('/requests', authenticate, adminOnly, async (req, res) => {
  try {
    let requests;
    if (req.user.sub_role === 'agent') {
      requests = await db.prepare(`
        SELECT fr.*, u.name as assigned_name 
        FROM flight_requests fr 
        LEFT JOIN users u ON fr.assigned_to = u.id 
        WHERE fr.assigned_to = ?
        ORDER BY fr.created_at DESC
      `).all(req.user.id);
    } else {
      requests = await db.prepare(`
        SELECT fr.*, u.name as assigned_name 
        FROM flight_requests fr 
        LEFT JOIN users u ON fr.assigned_to = u.id 
        ORDER BY fr.created_at DESC
      `).all();
    }
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve flight requests.' });
  }
});

// PUT /api/flights/requests/:id - Update flight request (Admin Only)
router.put('/requests/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes, assigned_to } = req.body;

  try {
    const request = await db.prepare('SELECT id, assigned_to FROM flight_requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Flight request not found.' });

    if (req.user.sub_role === 'agent' && request.assigned_to !== req.user.id && req.body.assigned_to === undefined) {
      return res.status(403).json({ error: 'Access denied. Case not assigned to you.' });
    }

    await db.prepare(`
      UPDATE flight_requests SET 
        status = COALESCE(?, status), 
        admin_notes = COALESCE(?, admin_notes),
        assigned_to = COALESCE(?, assigned_to)
      WHERE id = ?
    `).run(status, admin_notes, assigned_to, id);
    res.json({ message: 'Flight request updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update flight request.' });
  }
});

// GET /api/flights/rates - Get all flight rates (Public)
router.get('/rates', async (req, res) => {
  try {
    const rates = await db.prepare('SELECT * FROM flight_rates ORDER BY created_at DESC').all();
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve flight rates.' });
  }
});

// POST /api/flights/rates - Create a flight rate (Admin Only)
router.post('/rates', authenticate, adminOnly, async (req, res) => {
  const { from_city, to_city, price, airline } = req.body;
  if (!from_city || !to_city || !price) {
    return res.status(400).json({ error: 'From city, to city, and price are required.' });
  }

  try {
    const result = await db.prepare(
      'INSERT INTO flight_rates (from_city, to_city, price, airline) VALUES (?, ?, ?, ?)'
    ).run(from_city, to_city, price, airline || 'Multiple Airlines');
    
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      from_city, 
      to_city, 
      price, 
      airline: airline || 'Multiple Airlines' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save flight rate.' });
  }
});

// PUT /api/flights/rates/:id - Update a flight rate (Admin Only)
router.put('/rates/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { from_city, to_city, price, airline } = req.body;

  try {
    const rate = await db.prepare('SELECT id FROM flight_rates WHERE id = ?').get(id);
    if (!rate) return res.status(404).json({ error: 'Flight rate not found.' });

    await db.prepare(`
      UPDATE flight_rates SET 
        from_city = COALESCE(?, from_city), 
        to_city = COALESCE(?, to_city),
        price = COALESCE(?, price),
        airline = COALESCE(?, airline)
      WHERE id = ?
    `).run(from_city, to_city, price, airline, id);
    
    res.json({ message: 'Flight rate updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update flight rate.' });
  }
});

// DELETE /api/flights/rates/:id - Delete a flight rate (Admin Only)
router.delete('/rates/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const rate = await db.prepare('SELECT id FROM flight_rates WHERE id = ?').get(id);
    if (!rate) return res.status(404).json({ error: 'Flight rate not found.' });

    await db.prepare('DELETE FROM flight_rates WHERE id = ?').run(id);
    res.json({ message: 'Flight rate deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete flight rate.' });
  }
});

module.exports = router;
