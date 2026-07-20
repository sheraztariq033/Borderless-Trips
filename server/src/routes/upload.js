const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const path = require('path');

const isWorker = typeof globalThis.caches !== 'undefined' && !(typeof process !== 'undefined' && process.release && process.release.name === 'node');

const allowedExtensions = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
  '.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'
];

// Worker-compatible multipart parser
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      if (!boundaryMatch) return reject(new Error('No boundary found in multipart request'));
      
      const boundary = boundaryMatch[1].replace(/^["']|["']$/g, '');
      const boundaryBuffer = Buffer.from('--' + boundary);
      
      // Find the file part
      const parts = [];
      let start = 0;
      while (true) {
        const idx = body.indexOf(boundaryBuffer, start);
        if (idx === -1) break;
        if (start > 0) parts.push(body.slice(start, idx));
        start = idx + boundaryBuffer.length;
      }
      
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const headerStr = part.slice(0, headerEnd).toString();
        if (!headerStr.includes('filename=')) continue;
        
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);
        const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
        const filename = filenameMatch ? filenameMatch[1] : 'upload';
        const mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
        
        // Body starts after \r\n\r\n, and ends before trailing \r\n
        let fileData = part.slice(headerEnd + 4);
        if (fileData.length > 2 && fileData[fileData.length - 2] === 0x0d && fileData[fileData.length - 1] === 0x0a) {
          fileData = fileData.slice(0, -2);
        }
        
        resolve({ filename, mimetype, buffer: fileData, size: fileData.length });
        return;
      }
      reject(new Error('No file found in multipart request'));
    });
    req.on('error', reject);
  });
}

// POST /api/upload - Handle file upload (Authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    if (isWorker) {
      // Worker path: parse multipart manually and upload to R2 via S3 SDK
      const file = await parseMultipart(req);
      const ext = path.extname(file.filename).toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ error: `File type "${ext}" is not allowed.` });
      }
      
      // 100MB limit
      if (file.size > 100 * 1024 * 1024) {
        return res.status(400).json({ error: 'File is too large. Maximum size is 100MB.' });
      }
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const key = 'file-' + uniqueSuffix + ext;
      
      // Upload to R2 (Native R2 bucket binding first, then S3 API fallback)
      if (globalThis.R2_BUCKET) {
        console.log('☁️ Workers R2: Uploading natively via R2 binding:', key);
        await globalThis.R2_BUCKET.put(key, file.buffer, {
          httpMetadata: { contentType: file.mimetype }
        });
      } else {
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        const s3Util = require('../utils/s3');
        
        if (!s3Util.s3) {
          return res.status(500).json({ error: 'Storage is not configured.' });
        }
        
        await s3Util.s3.send(new PutObjectCommand({
          Bucket: s3Util.BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        }));
      }
      
      console.log('☁️ Worker: R2 upload successful:', key);
      
      // Save to media_files table
      const db = require('../models/database');
      try {
        await db.prepare(
          'INSERT INTO media_files (filename, original_name, mimetype, size, url) VALUES (?, ?, ?, ?, ?)'
        ).run(key, file.filename, file.mimetype, file.size, `/uploads/${key}`);
      } catch (dbErr) {
        console.warn('⚠️ Failed to save media file meta:', dbErr.message);
      }
      
      return res.json({
        url: `/uploads/${key}`,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      });
    } else {
      // Node.js path: use multer as before
      const multer = require('multer');
      const upload = require('../middleware/upload');
      const { validateUploadedFile } = require('../middleware/fileValidator');
      
      upload.single('file')(req, res, async function (err) {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ error: 'File is too large. Maximum size is 100MB.' });
            }
            return res.status(400).json({ error: `Upload error: ${err.message}` });
          }
          return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No file was uploaded.' });
        }

        await validateUploadedFile(req, res, async () => {
          const filename = req.file.key || req.file.filename;
          const db = require('../models/database');

          try {
            await db.prepare(
              'INSERT INTO media_files (filename, original_name, mimetype, size, url) VALUES (?, ?, ?, ?, ?)'
            ).run(filename, req.file.originalname, req.file.mimetype, req.file.size, `/uploads/${filename}`);
          } catch (dbErr) {
            console.warn('⚠️ Failed to save media file meta log in DB:', dbErr.message);
          }

          res.json({
            url: `/uploads/${filename}`,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
          });
        });
      });
    }
  } catch (error) {
    console.error('💥 Upload error:', error.message);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

module.exports = router;
