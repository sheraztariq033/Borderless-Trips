const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');
const s3Util = require('../utils/s3');

const isR2Configured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
);

let storage;

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

if (isR2Configured) {
  console.log('☁️ Multer: Configuring storage with Cloudflare R2');
  storage = multerS3({
    s3: s3Util.s3,
    bucket: s3Util.BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
} else {
  console.log('📁 Multer: Falling back to local disk storage');
  const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (to support video uploads)
  }
});

module.exports = upload;
