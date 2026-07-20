const rateLimit = require('express-rate-limit');

// On Cloudflare Workers, req.ip is undefined. Use CF headers or a default.
const getClientIp = (req) => {
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.ip || req.connection?.remoteAddress || '0.0.0.0';
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  keyGenerator: getClientIp,
  validate: { ip: false },
  skip: (req) => {
    const ip = getClientIp(req);
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV !== 'production';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  keyGenerator: getClientIp,
  validate: { ip: false },
  skip: (req) => {
    const ip = getClientIp(req);
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || process.env.NODE_ENV !== 'production';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login or registration attempts. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};

