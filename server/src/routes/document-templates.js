const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/document-templates - List templates
router.get('/', (req, res) => {
  const { service_type, country } = req.query;
  try {
    let query = 'SELECT * FROM document_templates';
    const params = [];
    const conditions = [];

    if (service_type) {
      conditions.push('service_type = ?');
      params.push(service_type);
    }
    if (country) {
      conditions.push('(country = ? OR country = "")');
      params.push(country);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY service_type ASC, name ASC';
    const templates = db.prepare(query).all(...params);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve document templates.' });
  }
});

// POST /api/document-templates - Create template (Admin Only)
router.post('/', authenticate, adminOnly, (req, res) => {
  const { service_type, country, name, description, required } = req.body;

  if (!service_type || !name) {
    return res.status(400).json({ error: 'Service type and name are required.' });
  }

  const validTypes = ['visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other'];
  if (!validTypes.includes(service_type)) {
    return res.status(400).json({ error: 'Invalid service type.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO document_templates (service_type, country, name, description, required)
      VALUES (?, ?, ?, ?, ?)
    `).run(service_type, country || '', name, description || '', required ? 1 : 0);

    const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Template created successfully.', template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document template.' });
  }
});

// PUT /api/document-templates/:id - Update template (Admin Only)
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { service_type, country, name, description, required } = req.body;

  try {
    const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(id);
    if (!template) {
      return res.status(404).json({ error: 'Document template not found.' });
    }

    db.prepare(`
      UPDATE document_templates SET
        service_type = COALESCE(?, service_type),
        country = COALESCE(?, country),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        required = COALESCE(?, required)
      WHERE id = ?
    `).run(service_type, country, name, description, required !== undefined ? (required ? 1 : 0) : null, id);

    const updated = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(id);
    res.json({ message: 'Template updated successfully.', template: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document template.' });
  }
});

// DELETE /api/document-templates/:id - Delete template (Admin Only)
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(id);
    if (!template) {
      return res.status(404).json({ error: 'Document template not found.' });
    }

    db.prepare('DELETE FROM document_templates WHERE id = ?').run(id);
    res.json({ message: 'Document template deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document template.' });
  }
});

module.exports = router;
