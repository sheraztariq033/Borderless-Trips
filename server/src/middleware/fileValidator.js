const fs = require('fs');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Util = require('../utils/s3');

// Helper to check if buffer matches magic bytes
function checkMagicBytes(buffer, extension) {
  const hex = buffer.toString('hex').toUpperCase();
  
  switch (extension) {
    case '.pdf':
      return hex.startsWith('25504446'); // %PDF
    case '.png':
      return hex.startsWith('89504E470D0A1A0A'); // PNG signature
    case '.jpg':
    case '.jpeg':
      return hex.startsWith('FFD8FF'); // JPEG start of image
    case '.gif':
      return hex.startsWith('47494638'); // GIF8
    case '.webp':
      return hex.startsWith('52494646') && hex.substring(16, 24) === '57454250'; // RIFF....WEBP
    case '.bmp':
      return hex.startsWith('424D'); // BM
    case '.zip':
    case '.docx':
    case '.xlsx':
      return hex.startsWith('504B0304') || hex.startsWith('504B0506') || hex.startsWith('504B0708'); // PK (zip or modern Office docs)
    case '.csv':
    case '.txt':
      // Text files: ensure no null bytes/binary control chars
      return !buffer.slice(0, 1024).includes(0);
    default:
      // Fallback: allow if not strictly blacklisted
      return true;
  }
}

async function validateUploadedFile(req, res, next) {
  if (!req.file) return next();

  const ext = require('path').extname(req.file.originalname || '').toLowerCase();
  
  try {
    let fileBuffer;
    
    // 1. Handle R2 upload validation
    if (req.file.location && s3Util.s3) {
      const key = req.file.key;
      const command = new GetObjectCommand({
        Bucket: s3Util.BUCKET_NAME,
        Key: key,
        Range: 'bytes=0-11'
      });
      
      const response = await s3Util.s3.send(command);
      const byteArray = await response.Body.transformToByteArray();
      fileBuffer = Buffer.from(byteArray);
      
      if (!checkMagicBytes(fileBuffer, ext)) {
        console.warn(`🛑 Security Alert: File signature mismatch for uploaded R2 file ${key}. Deleting...`);
        await s3Util.s3.send(new DeleteObjectCommand({
          Bucket: s3Util.BUCKET_NAME,
          Key: key
        }));
        return res.status(400).json({ error: `Security check failed: File content does not match extension ${ext}.` });
      }
    } 
    // 2. Handle Local Disk upload validation
    else if (req.file.path) {
      const fd = fs.openSync(req.file.path, 'r');
      const buffer = Buffer.alloc(12);
      fs.readSync(fd, buffer, 0, 12, 0);
      fs.closeSync(fd);
      
      if (!checkMagicBytes(buffer, ext)) {
        console.warn(`🛑 Security Alert: File signature mismatch for local file ${req.file.path}. Deleting...`);
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: `Security check failed: File content does not match extension ${ext}.` });
      }
    }
    
    next();
  } catch (err) {
    console.error('💥 File validation middleware error:', err.message);
    res.status(500).json({ error: 'Internal validation error during file upload.' });
  }
}

module.exports = { validateUploadedFile };
