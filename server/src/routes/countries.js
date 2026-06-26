const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/countries - Public list of active countries
router.get('/', (req, res) => {
  try {
    const { region } = req.query;
    let query = 'SELECT * FROM countries WHERE active = 1';
    const params = [];
    if (region && region !== 'all') {
      query += ' AND region = ?';
      params.push(region);
    }
    query += ' ORDER BY name ASC';
    const countries = db.prepare(query).all(...params);
    res.json(countries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch countries.' });
  }
});

// POST /api/countries - Add country (Admin)
router.post('/', authenticate, adminOnly, (req, res) => {
  const { name, code, region, visa_required } = req.body;
  if (!name) return res.status(400).json({ error: 'Country name is required.' });
  try {
    db.prepare('INSERT INTO countries (name, code, region, visa_required, active) VALUES (?, ?, ?, ?, 1)')
      .run(name, code || '', region || 'europe', visa_required !== undefined ? (visa_required ? 1 : 0) : 1);
    res.status(201).json({ message: 'Country added successfully.' });
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Country already exists.' });
    }
    res.status(500).json({ error: 'Failed to add country.' });
  }
});

// PUT /api/countries/:id - Update country (Admin)
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { name, code, region, visa_required, active } = req.body;
  try {
    const country = db.prepare('SELECT id FROM countries WHERE id = ?').get(id);
    if (!country) return res.status(404).json({ error: 'Country not found.' });
    db.prepare(`
      UPDATE countries SET
        name = COALESCE(?, name), code = COALESCE(?, code),
        region = COALESCE(?, region), visa_required = COALESCE(?, visa_required),
        active = COALESCE(?, active)
      WHERE id = ?
    `).run(name, code, region, visa_required !== undefined ? (visa_required ? 1 : 0) : null, active !== undefined ? (active ? 1 : 0) : null, id);
    res.json({ message: 'Country updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update country.' });
  }
});

// DELETE /api/countries/:id - Deactivate country (Admin)
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE countries SET active = 0 WHERE id = ?').run(id);
    res.json({ message: 'Country deactivated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate country.' });
  }
});

module.exports = router;
