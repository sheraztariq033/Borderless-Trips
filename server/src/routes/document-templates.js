const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/document-templates/folders - List all folders
router.get('/folders', authenticate, (req, res) => {
  try {
    const folders = db.prepare(`
      SELECT f.id, f.name, f.created_at, COUNT(t.id) as template_count 
      FROM document_folders f 
      LEFT JOIN document_templates t ON f.id = t.folder_id 
      GROUP BY f.id 
      ORDER BY f.name ASC
    `).all();
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve document folders.' });
  }
});

// POST /api/document-templates/folders - Create folder (Admin Only)
router.post('/folders', authenticate, adminOnly, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM document_folders WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'A folder with this name already exists.' });
    }

    const result = db.prepare('INSERT INTO document_folders (name) VALUES (?)').run(name.trim());
    const folder = db.prepare('SELECT * FROM document_folders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Folder created successfully.', folder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document folder.' });
  }
});

// PUT /api/document-templates/folders/:id - Update folder name (Admin Only)
router.put('/folders/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Folder name is required.' });
  }

  try {
    const folder = db.prepare('SELECT id FROM document_folders WHERE id = ?').get(id);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    const existing = db.prepare('SELECT id FROM document_folders WHERE name = ? AND id != ?').get(name.trim(), id);
    if (existing) {
      return res.status(400).json({ error: 'A folder with this name already exists.' });
    }

    db.prepare('UPDATE document_folders SET name = ? WHERE id = ?').run(name.trim(), id);
    res.json({ message: 'Folder updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update folder.' });
  }
});

// DELETE /api/document-templates/folders/:id - Delete folder (Admin Only)
router.delete('/folders/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;

  try {
    const folder = db.prepare('SELECT id FROM document_folders WHERE id = ?').get(id);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    // Set folder_id to NULL for any templates in this folder, then delete the folder
    db.transaction(() => {
      db.prepare('UPDATE document_templates SET folder_id = NULL WHERE folder_id = ?').run(id);
      db.prepare('DELETE FROM document_folders WHERE id = ?').run(id);
    })();

    res.json({ message: 'Folder deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete folder.' });
  }
});

// GET /api/document-templates - List templates
router.get('/', (req, res) => {
  const { service_type, country } = req.query;
  try {
    let query = `
      SELECT t.*, f.name as folder_name 
      FROM document_templates t 
      LEFT JOIN document_folders f ON t.folder_id = f.id
    `;
    const params = [];
    const conditions = [];

    if (service_type) {
      conditions.push('t.service_type = ?');
      params.push(service_type);
    }
    if (country) {
      conditions.push('(t.country = ? OR t.country = "")');
      params.push(country);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.service_type ASC, f.name ASC, t.name ASC';
    const templates = db.prepare(query).all(...params);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve document templates.' });
  }
});

// POST /api/document-templates - Create template (Admin Only)
router.post('/', authenticate, adminOnly, (req, res) => {
  const { service_type, country, name, description, required, folder_id } = req.body;

  if (!service_type || !name) {
    return res.status(400).json({ error: 'Service type and name are required.' });
  }

  const validTypes = ['visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other'];
  if (!validTypes.includes(service_type)) {
    return res.status(400).json({ error: 'Invalid service type.' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO document_templates (service_type, country, name, description, required, folder_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(service_type, country || '', name, description || '', required ? 1 : 0, folder_id || null);

    const template = db.prepare('SELECT * FROM document_templates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Template created successfully.', template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document template.' });
  }
});

// PUT /api/document-templates/:id - Update template (Admin Only)
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { service_type, country, name, description, required, folder_id } = req.body;

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
        required = COALESCE(?, required),
        folder_id = ?
      WHERE id = ?
    `).run(
      service_type,
      country,
      name,
      description,
      required !== undefined ? (required ? 1 : 0) : null,
      folder_id !== undefined ? folder_id : template.folder_id,
      id
    );

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

