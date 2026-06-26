const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

// POST /api/upload - Handle file upload (Authenticated users)
router.post('/', authenticate, (req, res) => {
  upload.single('file')(req, res, function (err) {
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

    // Return uploaded file metadata
    res.json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  });
});

module.exports = router;
