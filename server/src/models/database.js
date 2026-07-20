// Borderless Trips 2.0 - PostgreSQL Database Pool Adapter
// Bridges SQLite synchronous queries to asynchronous PostgreSQL queries for Supabase

const formatQuery = (sql, params) => {
  if (!params || params.length === 0) return sql;
  
  let formattedSql = sql;
  for (let i = params.length - 1; i >= 0; i--) {
    const val = params[i];
    let formattedVal;
    
    if (val === null || val === undefined) {
      formattedVal = 'NULL';
    } else if (typeof val === 'number') {
      formattedVal = String(val);
    } else if (typeof val === 'boolean') {
      formattedVal = val ? 'TRUE' : 'FALSE';
    } else {
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      formattedVal = "'" + valStr.replace(/'/g, "''") + "'";
    }
    
    const regex = new RegExp('\\$' + (i + 1) + '(?![0-9])', 'g');
    formattedSql = formattedSql.replace(regex, formattedVal);
  }
  return formattedSql;
};

const isWorker = typeof globalThis.caches !== 'undefined' && !(typeof process !== 'undefined' && process.release && process.release.name === 'node');
require('dotenv').config();

let pool = null;

const getPool = () => {
  if (isWorker) {
    return {
      query: async (sql, params) => {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("💥 SUPABASE_URL and SUPABASE_ANON_KEY are missing in environment variables.");
        }
        
        const formattedSql = formatQuery(sql, params);
        console.log('💻 RUNNING WORKER SQL:', formattedSql);
        
        const cleanUrl = supabaseUrl.replace(/\/$/, '');
        const rpcUrl = `${cleanUrl}/rest/v1/rpc/exec_sql`;
        
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            query_text: formattedSql
          })
        });
        
        const data = await response.json();
        console.log('💻 WORKER SQL RESULT ROWS:', Array.isArray(data) ? data.length : typeof data, data);
        if (!response.ok) {
          throw new Error(data.message || data.error || 'Database query error');
        }
        
        let rows = [];
        let rowCount = 0;
        
        if (Array.isArray(data)) {
          // Backward compatibility for old exec_sql array format
          rows = data;
          rowCount = data.length;
        } else if (data && typeof data === 'object') {
          if (data.error) {
            throw new Error(`💥 Database RPC error: ${data.error} (State: ${data.state}, Query: ${data.query || formattedSql})`);
          }
          rows = Array.isArray(data.rows) ? data.rows : [];
          rowCount = typeof data.rowCount === 'number' ? data.rowCount : rows.length;
        }
        
        return {
          rows,
          rowCount
        };
      }
    };
  }

  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("💥 DATABASE_URL is missing in environment variables. Database connection cannot be established.");
    }
    const cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: (connectionString.includes('supabase.co') || connectionString.includes('supabase.com'))
        ? { rejectUnauthorized: false }
        : false
    });
  }
  return pool;
};

// Initial connection test for environments where DATABASE_URL is populated on start
if (process.env.DATABASE_URL && !isWorker) {
  try {
    const p = getPool();
    p.connect(async (err, client, release) => {
      if (err) {
        console.error('💥 PostgreSQL connection failed:', err.message);
      } else {
        console.log('🚀 Connected to Supabase PostgreSQL database successfully!');
        
        // Auto-migrate schema updates (e.g. adding missing 'ref' column to notifications)
        try {
          await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ref TEXT DEFAULT ''");
          await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT NULL");
          await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT DEFAULT NULL");
          await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT NULL");
          await client.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_requested INTEGER DEFAULT 0");
          await client.query("ALTER TABLE visa_applications ADD COLUMN IF NOT EXISTS payment_requested INTEGER DEFAULT 0");
          await client.query(`
            CREATE TABLE IF NOT EXISTS media_files (
              id SERIAL PRIMARY KEY,
              filename TEXT UNIQUE NOT NULL,
              original_name TEXT NOT NULL,
              mimetype TEXT NOT NULL,
              size INTEGER NOT NULL,
              url TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('🏁 Notifications and Media schema validation completed.');
        } catch (migrateErr) {
          console.warn('⚠️ Schema migration warning:', migrateErr.message);
        }

        release();
        try {
          const { seedDatabase } = require('./seeder');
          await seedDatabase();
        } catch (e) {
          console.error('💥 Failed to run seeding on startup:', e.message);
        }
      }
    });
  } catch (initErr) {
    console.warn('⚠️ Database pool initialization deferred:', initErr.message);
  }
} else {
  console.warn('⚠️ WARNING: DATABASE_URL is missing in environment variables. Database pool will initialize dynamically.');
}

// Compatibility wrapper matching the SQLite api
const db = {
  // Direct client access if needed
  get pool() {
    return getPool();
  },

  // Exec raw SQL statements (async)
  exec: async (sql) => {
    try {
      return await getPool().query(sql);
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
    // Tables that don't have an 'id' column (use a different PK)
    const noIdTables = ['settings'];
    const insertTableMatch = pgSql.match(/INSERT\s+INTO\s+(\w+)/i);
    const insertTable = insertTableMatch ? insertTableMatch[1].toLowerCase() : '';
    const hasIdColumn = !noIdTables.includes(insertTable);
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
      if (hasIdColumn) {
        pgSql = pgSql.trim().replace(/;$/, '') + ' RETURNING id';
      }
    }

    // Return the query execution wrappers
    return {
      // Return single row
      get: async (...params) => {
        try {
          const flatParams = params.flat().map(p => p === undefined ? null : p);
          const result = await getPool().query(pgSql, flatParams);
          return result.rows[0];
        } catch (err) {
          console.error('💥 PG query get error:', err.message, '\nQuery:', pgSql, '\nParams:', params);
          throw err;
        }
      },

      // Return all rows
      all: async (...params) => {
        try {
          const flatParams = params.flat().map(p => p === undefined ? null : p);
          const result = await getPool().query(pgSql, flatParams);
          return result.rows;
        } catch (err) {
          console.error('💥 PG query all error:', err.message, '\nQuery:', pgSql, '\nParams:', params);
          throw err;
        }
      },

      // Execute mutating command (INSERT/UPDATE/DELETE)
      run: async (...params) => {
        try {
          const flatParams = params.flat().map(p => p === undefined ? null : p);
          const result = await getPool().query(pgSql, flatParams);
          
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
