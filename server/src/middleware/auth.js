const { verifyJwt } = require('../utils/crypto');
const db = require('../models/database');
const { supabase } = require('../utils/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'borderless_secret_key_123';

// Helper: fetch user by condition without LEFT JOIN (compatible with exec_sql RPC)
async function fetchUser(field, value) {
  const user = await db.prepare(
    `SELECT id, name, email, phone, nationality, role, sub_role, profile_photo, passport_expiry, created_at, assigned_to FROM users WHERE ${field} = ?`
  ).get(value);
  if (user && user.assigned_to) {
    const assignee = await db.prepare('SELECT name FROM users WHERE id = ?').get(user.assigned_to);
    user.assigned_name = assignee ? assignee.name : null;
  } else if (user) {
    user.assigned_name = null;
  }
  return user;
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Try local JWT verification first
  try {
    console.log('🔑 AUTH: secret prefix:', String(JWT_SECRET).substring(0, 8), 'len:', String(JWT_SECRET).length);
    const decoded = verifyJwt(token, JWT_SECRET);
    console.log('🔑 AUTH: JWT verified, user id:', decoded.id, 'role:', decoded.role);
    const user = await fetchUser('id', decoded.id);
    console.log('🔑 AUTH: DB user found:', !!user, user ? `id=${user.id} name=${user.name}` : 'null');

    if (user) {
      req.user = user;
      return next();
    }
  } catch (localError) {
    console.error('💥 local JWT/DB auth error:', localError.message);
    req.localAuthError = localError.message;
    // 2. If local fails, try Supabase Auth token verification
    if (supabase) {
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (!error && supabaseUser) {
          const email = supabaseUser.email.toLowerCase();
          
          // Lookup database user by email
          let dbUser = await fetchUser('email', email);

          if (!dbUser) {
            // Auto-provision user in our database if they registered on Supabase
            const name = supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'Customer';
            const phone = supabaseUser.user_metadata?.phone || '';
            const nationality = supabaseUser.user_metadata?.nationality || '';
            const { hashPassword } = require('../utils/crypto');
            const placeholderHash = hashPassword(Math.random().toString(36));
            
            const insertResult = await db.prepare(
              'INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).run(name, email, placeholderHash, phone, nationality, 'customer', '');
            
            dbUser = await fetchUser('id', insertResult.lastInsertRowid);
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

  return res.status(401).json({ error: 'Authentication failed. Invalid or expired token: ' + (req.localAuthError || 'Unknown error') });
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
