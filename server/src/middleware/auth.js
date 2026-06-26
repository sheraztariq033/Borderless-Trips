const jwt = require('jsonwebtoken');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'borderless_secret_key_123';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.nationality, u.role, u.sub_role, u.profile_photo, u.created_at, u.assigned_to,
        a.name as assigned_name
      FROM users u
      LEFT JOIN users a ON u.assigned_to = a.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found. Authentication failed.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid token.' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin rights required.' });
  }
  next();
}

module.exports = {
  authenticate,
  adminOnly,
  JWT_SECRET
};
