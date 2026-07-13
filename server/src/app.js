const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const db = require('./models/database');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const packageRoutes = require('./routes/packages');
const bookingRoutes = require('./routes/bookings');
const visaRoutes = require('./routes/visa');
const flightRoutes = require('./routes/flights');
const inquiryRoutes = require('./routes/inquiries');
const newsletterRoutes = require('./routes/newsletter');
const blogRoutes = require('./routes/blog');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');
const mediaRoutes = require('./routes/media');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const serviceRequestRoutes = require('./routes/service-requests');
const countryRoutes = require('./routes/countries');
const documentTemplateRoutes = require('./routes/document-templates');
const { router: businessSuiteRoutes } = require('./routes/business-suite');
const publicRoutes = require('./routes/public');

const app = express();

// Middlewares
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost and any LAN IP on common dev ports
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded files (Cloudflare R2 streaming proxy with local disk fallback)
const isR2Configured = !!(
  process.env.R2_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID.startsWith('YOUR_') &&
  process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.startsWith('YOUR_') &&
  process.env.R2_SECRET_ACCESS_KEY && !process.env.R2_SECRET_ACCESS_KEY.startsWith('YOUR_')
);

if (isR2Configured) {
  const { getObjectStream } = require('./utils/s3');
  app.get('/uploads/:filename', (req, res) => {
    const { filename } = req.params;
    const stream = getObjectStream(filename);
    stream.on('error', (err) => {
      console.warn(`⚠️ S3 stream error for ${filename}:`, err.message);
      // Fallback to local files if stream error occurs (e.g. file is not in R2 but exists locally)
      const localPath = path.join(__dirname, '..', 'data', 'uploads', filename);
      res.sendFile(localPath, (localErr) => {
        if (localErr) {
          if (!res.headersSent) {
            res.status(404).json({ error: 'File not found.' });
          }
        }
      });
    });
    stream.pipe(res);
  });
} else {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'data', 'uploads')));
}

// Serve API with rate limiting
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/document-templates', documentTemplateRoutes);
app.use('/api/business-suite', businessSuiteRoutes);
app.use('/api/public', publicRoutes);

// Optional: Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Borderless Trips API Server running...');
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Server Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
