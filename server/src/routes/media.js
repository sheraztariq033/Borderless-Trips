const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { deleteObject } = require('../utils/s3');
const path = require('path');
const fs = require('fs');

// GET /api/media - Get all media files (Admin Only)
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const files = await db.prepare('SELECT * FROM media_files ORDER BY created_at DESC').all();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve media library: ' + err.message });
  }
});

// DELETE /api/media/:id - Delete media file from database and storage (Admin Only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const file = await db.prepare('SELECT * FROM media_files WHERE id = ?').get(id);
    if (!file) {
      return res.status(404).json({ error: 'Media file not found.' });
    }

    // 1. Delete from Cloudflare R2 / S3
    const isR2Configured = !!(
      process.env.R2_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID.startsWith('YOUR_') &&
      process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.startsWith('YOUR_') &&
      process.env.R2_SECRET_ACCESS_KEY && !process.env.R2_SECRET_ACCESS_KEY.startsWith('YOUR_')
    );

    if (isR2Configured) {
      await deleteObject(file.filename);
    }

    // 2. Delete from local fallback disk if it exists
    const localPath = path.join(__dirname, '..', '..', 'data', 'uploads', file.filename);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.warn('Failed to delete local fallback file:', err.message);
      }
    }

    // 3. Delete from database
    await db.prepare('DELETE FROM media_files WHERE id = ?').run(id);

    res.json({ message: 'Media file deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete media file: ' + err.message });
  }
});

module.exports = router;
