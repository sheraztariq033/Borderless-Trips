const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const s3Util = require('../utils/s3');

const isR2Configured = !!(
  process.env.R2_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID.startsWith('YOUR_') &&
  process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.startsWith('YOUR_') &&
  process.env.R2_SECRET_ACCESS_KEY && !process.env.R2_SECRET_ACCESS_KEY.startsWith('YOUR_')
);

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
    // Videos
    '.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogg',
    // Documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${ext}" is not allowed. Supported: images, videos, and documents.`), false);
  }
};

// Hybrid Storage Engine that attempts R2 upload first, then falls back to local disk on failure
class HybridStorage {
  constructor() {
    this.s3Storage = isR2Configured ? multerS3({
      s3: s3Util.s3,
      bucket: s3Util.BUCKET_NAME,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }) : null;

    const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    this.diskStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    this.r2Failed = false;
  }

  _handleFile(req, file, cb) {
    const self = this;
    if (self.s3Storage && !self.r2Failed) {
      console.log('☁️ Multer: Attempting Cloudflare R2 upload...');
      self.s3Storage._handleFile(req, file, function (err, info) {
        if (err) {
          console.warn('⚠️ Cloudflare R2 upload failed, falling back to local disk storage:', err.message);
          self.r2Failed = true; // Disable R2 for subsequent file writes in this process
          self.diskStorage._handleFile(req, file, cb);
        } else {
          console.log('☁️ Multer: Cloudflare R2 upload successful!');
          cb(null, info);
        }
      });
    } else {
      console.log('📁 Multer: Saving file to local disk storage...');
      self.diskStorage._handleFile(req, file, cb);
    }
  }

  _removeFile(req, file, cb) {
    if (this.s3Storage && !this.r2Failed) {
      this.s3Storage._removeFile(req, file, cb);
    } else {
      this.diskStorage._removeFile(req, file, cb);
    }
  }
}

const storage = new HybridStorage();

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (to support video uploads)
  }
});

module.exports = upload;
