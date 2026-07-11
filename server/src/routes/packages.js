const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

const parseArray = (str) => {
  if (!str) return [];
  try {
    let parsed = JSON.parse(str);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    return Array.isArray(parsed) ? parsed : [str];
  } catch (e) {
    if (typeof str === 'string' && str.trim()) {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }
};

// GET /api/packages - get all packages (with filters for search/duration/price/type)
router.get('/', async (req, res) => {
  const { search, destination, minPrice, maxPrice, type, featured } = req.query;
  
  let query = 'SELECT * FROM packages WHERE active = 1';
  const params = [];

  if (search) {
    query += ' AND (title LIKE ? OR destination LIKE ? OR description LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (destination) {
    query += ' AND destination = ?';
    params.push(destination);
  }

  if (minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (featured === 'true' || featured === '1') {
    query += ' AND featured = 1';
  }

  try {
    const packages = await db.prepare(query).all(...params);
    // Parse JSON fields
    const formatted = packages.map(pkg => ({
      ...pkg,
      originalPrice: pkg.original_price,
      images: parseArray(pkg.images),
      itinerary: parseArray(pkg.itinerary),
      includes: parseArray(pkg.includes),
      excludes: parseArray(pkg.excludes),
      featured: !!pkg.featured,
      active: !!pkg.active
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve packages.' });
  }
});

// GET /api/packages/:id - get package by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pkg = await db.prepare('SELECT * FROM packages WHERE id = ? AND active = 1').get(id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found.' });
    }
    
    res.json({
      ...pkg,
      originalPrice: pkg.original_price,
      images: parseArray(pkg.images),
      itinerary: parseArray(pkg.itinerary),
      includes: parseArray(pkg.includes),
      excludes: parseArray(pkg.excludes),
      featured: !!pkg.featured,
      active: !!pkg.active
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve package.' });
  }
});

// POST /api/packages - Create package (Admin Only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  const {
    title, destination, description, duration, price, original_price,
    type, images, itinerary, includes, excludes, featured
  } = req.body;

  if (!title || !destination || !price) {
    return res.status(400).json({ error: 'Title, destination, and price are required.' });
  }

  try {
    const result = await db.prepare(`
      INSERT INTO packages (
        title, destination, description, duration, price, original_price,
        type, images, itinerary, includes, excludes, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      destination,
      description || '',
      duration || '',
      parseFloat(price),
      original_price ? parseFloat(original_price) : null,
      type || 'adventure',
      JSON.stringify(images || []),
      JSON.stringify(itinerary || []),
      JSON.stringify(includes || []),
      JSON.stringify(excludes || []),
      featured ? 1 : 0
    );

    res.status(201).json({ message: 'Package created successfully.', packageId: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to create package.' });
  }
});

// PUT /api/packages/:id - Update package (Admin Only)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const {
    title, destination, description, duration, price, original_price,
    type, images, itinerary, includes, excludes, featured, active
  } = req.body;

  try {
    const pkg = await db.prepare('SELECT id FROM packages WHERE id = ?').get(id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    await db.prepare(`
      UPDATE packages SET
        title = COALESCE(?, title),
        destination = COALESCE(?, destination),
        description = COALESCE(?, description),
        duration = COALESCE(?, duration),
        price = COALESCE(?, price),
        original_price = COALESCE(?, original_price),
        type = COALESCE(?, type),
        images = COALESCE(?, images),
        itinerary = COALESCE(?, itinerary),
        includes = COALESCE(?, includes),
        excludes = COALESCE(?, excludes),
        featured = COALESCE(?, featured),
        active = COALESCE(?, active)
      WHERE id = ?
    `).run(
      title,
      destination,
      description,
      duration,
      price ? parseFloat(price) : null,
      original_price ? parseFloat(original_price) : null,
      type,
      images ? JSON.stringify(images) : null,
      itinerary ? JSON.stringify(itinerary) : null,
      includes ? JSON.stringify(includes) : null,
      excludes ? JSON.stringify(excludes) : null,
      featured !== undefined ? (featured ? 1 : 0) : null,
      active !== undefined ? (active ? 1 : 0) : null,
      id
    );

    res.json({ message: 'Package updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to update package.' });
  }
});

// DELETE /api/packages/:id - soft delete package (Admin Only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const pkg = await db.prepare('SELECT id FROM packages WHERE id = ?').get(id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    await db.prepare('UPDATE packages SET active = 0 WHERE id = ?').run(id);
    res.json({ message: 'Package deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to delete package.' });
  }
});

module.exports = router;
