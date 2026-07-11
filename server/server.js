const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./src/models/database');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/auth');
const packageRoutes = require('./src/routes/packages');
const bookingRoutes = require('./src/routes/bookings');
const visaRoutes = require('./src/routes/visa');
const flightRoutes = require('./src/routes/flights');
const inquiryRoutes = require('./src/routes/inquiries');
const newsletterRoutes = require('./src/routes/newsletter');
const blogRoutes = require('./src/routes/blog');
const analyticsRoutes = require('./src/routes/analytics');
const aiRoutes = require('./src/routes/ai');
const uploadRoutes = require('./src/routes/upload');
const mediaRoutes = require('./src/routes/media');
const messageRoutes = require('./src/routes/messages');
const notificationRoutes = require('./src/routes/notifications');
const serviceRequestRoutes = require('./src/routes/service-requests');
const countryRoutes = require('./src/routes/countries');
const documentTemplateRoutes = require('./src/routes/document-templates');
const { router: businessSuiteRoutes } = require('./src/routes/business-suite');
const publicRoutes = require('./src/routes/public');

const app = express();
const PORT = process.env.PORT || 3001;

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
  const { getObjectStream } = require('./src/utils/s3');
  app.get('/uploads/:filename', (req, res) => {
    const { filename } = req.params;
    const stream = getObjectStream(filename);
    stream.on('error', (err) => {
      console.warn(`⚠️ S3 stream error for ${filename}:`, err.message);
      // Fallback to local files if stream error occurs (e.g. file is not in R2 but exists locally)
      const localPath = path.join(__dirname, 'data', 'uploads', filename);
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
  app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));
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
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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

const runMigrations = require('./migrate');
const { startScheduler } = require('./src/utils/cron');

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server launched successfully on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.100.75:${PORT}`);
  try {
    await runMigrations();
    startScheduler();
  } catch (err) {
    console.error('💥 Migrations/Scheduler failed on startup:', err.message);
  }
});
