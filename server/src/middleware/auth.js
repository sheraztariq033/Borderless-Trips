const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { supabase } = require('../utils/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'borderless_secret_key_123';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try local JWT verification first
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.nationality, u.role, u.sub_role, u.profile_photo, u.created_at, u.assigned_to,
        a.name as assigned_name
      FROM users u
      LEFT JOIN users a ON u.assigned_to = a.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (user) {
      req.user = user;
      return next();
    }
  } catch (localError) {
    // 2. If local fails, try Supabase Auth token verification
    if (supabase) {
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (!error && supabaseUser) {
          const email = supabaseUser.email.toLowerCase();
          
          // Lookup database user by email
          let dbUser = await db.prepare(`
            SELECT u.id, u.name, u.email, u.phone, u.nationality, u.role, u.sub_role, u.profile_photo, u.created_at, u.assigned_to,
              a.name as assigned_name
            FROM users u
            LEFT JOIN users a ON u.assigned_to = a.id
            WHERE u.email = ?
          `).get(email);

          if (!dbUser) {
            // Auto-provision user in our database if they registered on Supabase
            const name = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Customer';
            const phone = supabaseUser.user_metadata?.phone || '';
            const nationality = supabaseUser.user_metadata?.nationality || '';
            
            // Generate a random placeholder password hash
            const bcrypt = require('bcryptjs');
            const placeholderHash = bcrypt.hashSync(Math.random().toString(36), 10);
            
            const insertResult = await db.prepare(
              'INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).run(name, email, placeholderHash, phone, nationality, 'customer', '');
            
            dbUser = await db.prepare(`
              SELECT u.id, u.name, u.email, u.phone, u.nationality, u.role, u.sub_role, u.profile_photo, u.created_at, u.assigned_to,
                a.name as assigned_name
              FROM users u
              LEFT JOIN users a ON u.assigned_to = a.id
              WHERE u.id = ?
            `).get(insertResult.lastInsertRowid);
          }

          if (dbUser) {
            req.user = dbUser;
            return next();
          }
        }
      } catch (supabaseError) {
        console.error('Supabase Auth verification failure:', supabaseError);
      }
    }
  }

  return res.status(401).json({ error: 'Authentication failed. Invalid or expired token.' });
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
