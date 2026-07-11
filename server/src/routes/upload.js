const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');
const { validateUploadedFile } = require('../middleware/fileValidator');

// POST /api/upload - Handle file upload (Authenticated users)
router.post('/', authenticate, (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      // Multer-specific errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File is too large. Maximum size is 100MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      // Custom file-filter errors
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // Run magic-byte signature check
    await validateUploadedFile(req, res, async () => {
      const filename = req.file.key || req.file.filename;
      const db = require('../models/database');

      try {
        await db.prepare(`
          INSERT INTO media_files (filename, original_name, mimetype, size, url)
          VALUES (?, ?, ?, ?, ?)
        `).run(filename, req.file.originalname, req.file.mimetype, req.file.size, `/uploads/${filename}`);
      } catch (dbErr) {
        console.warn('⚠️ Failed to save media file meta log in DB:', dbErr.message);
      }

      // Return uploaded file metadata
      res.json({
        url: `/uploads/${filename}`,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    });
  });
});

module.exports = router;
