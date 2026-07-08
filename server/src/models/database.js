// Borderless Trips 2.0 - PostgreSQL Database Pool Adapter
// Bridges SQLite synchronous queries to asynchronous PostgreSQL queries for Supabase

const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('💥 CRITICAL ERROR: DATABASE_URL is missing in environment variables (.env)');
  process.exit(1);
}

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.co') 
    ? { rejectUnauthorized: false } // Required for Supabase ssl connections
    : false
});

// Test connection on launch
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('💥 PostgreSQL connection failed:', err.message);
  } else {
    console.log('🚀 Connected to Supabase PostgreSQL database successfully!');
    release();
    try {
      const { seedDatabase } = require('./seeder');
      await seedDatabase();
    } catch (e) {
      console.error('💥 Failed to run seeding on startup:', e.message);
    }
  }
});

// Compatibility wrapper matching the SQLite api
const db = {
  // Direct client access if needed
  pool,

  // Exec raw SQL statements (async)
  exec: async (sql) => {
    try {
      return await pool.query(sql);
    } catch (err) {
      console.error('💥 Database exec error:', err.message, '\nQuery:', sql);
      throw err;
    }
  },

  // Mock prep statement compiler returning Promise-based helpers
  prepare: (sql) => {
    // 1. Translate SQLite queries to PostgreSQL dialact
    let pgSql = sql;

    // Convert SQLite 'INSERT OR REPLACE INTO settings' -> PostgreSQL ON CONFLICT update
    if (pgSql.toUpperCase().includes('INSERT OR REPLACE INTO SETTINGS')) {
      pgSql = 'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
    }
    // Convert SQLite 'INSERT OR IGNORE INTO settings' -> PostgreSQL ON CONFLICT ignore
    else if (pgSql.toUpperCase().includes('INSERT OR IGNORE INTO SETTINGS')) {
      pgSql = 'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING';
    }
    // Convert generic INSERT OR IGNORE -> ON CONFLICT
    else if (pgSql.toUpperCase().includes('INSERT OR IGNORE INTO')) {
      // Find the table and fields to construct standard postgres ignore
      const match = pgSql.match(/INSERT OR IGNORE INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const table = match[1];
        const fields = match[2];
        const values = match[3];
        
        // Handle common unique keys like 'email' or 'booking_ref'
        let conflictKey = 'id';
        if (table.toLowerCase() === 'users' || table.toLowerCase() === 'newsletter_subscribers') conflictKey = 'email';
        else if (table.toLowerCase() === 'bookings') conflictKey = 'booking_ref';
        else if (table.toLowerCase() === 'visa_applications') conflictKey = 'app_ref';
        else if (table.toLowerCase() === 'document_folders') conflictKey = 'name';
        
        pgSql = `INSERT INTO ${table} (${fields}) VALUES (${values}) ON CONFLICT (${conflictKey}) DO NOTHING`;
      }
    }

    // 2. Map SQLite '?' parameters to PostgreSQL '$1', '$2', etc.
    let index = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${index++}`);

    // 3. Handle auto-generating and returning row IDs on INSERT
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql = pgSql.trim().replace(/;$/, '') + ' RETURNING id';
    }

    // Return the query execution wrappers
    return {
      // Return single row
      get: async (...params) => {
        try {
          const flatParams = params.flat();
          const result = await pool.query(pgSql, flatParams);
          return result.rows[0];
        } catch (err) {
          console.error('💥 PG query get error:', err.message, '\nQuery:', pgSql, '\nParams:', params);
          throw err;
        }
      },

      // Return all rows
      all: async (...params) => {
        try {
          const flatParams = params.flat();
          const result = await pool.query(pgSql, flatParams);
          return result.rows;
        } catch (err) {
          console.error('💥 PG query all error:', err.message, '\nQuery:', pgSql, '\nParams:', params);
          throw err;
        }
      },

      // Execute mutating command (INSERT/UPDATE/DELETE)
      run: async (...params) => {
        try {
          const flatParams = params.flat();
          const result = await pool.query(pgSql, flatParams);
          
          let lastInsertRowid = null;
          if (isInsert && result.rows[0]) {
            lastInsertRowid = result.rows[0].id;
          }

          return {
            changes: result.rowCount,
            lastInsertRowid: lastInsertRowid
          };
        } catch (err) {
          console.error('💥 PG query run error:', err.message, '\nQuery:', pgSql, '\nParams:', params);
          throw err;
        }
      }
    };
  }
};

module.exports = db;
