const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', '..', 'data', 'borderless.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT DEFAULT '',
    nationality TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    sub_role TEXT DEFAULT '' CHECK(sub_role IN ('', 'manager', 'agent', 'viewer')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    price REAL NOT NULL,
    original_price REAL,
    type TEXT DEFAULT 'adventure',
    images TEXT DEFAULT '[]',
    itinerary TEXT DEFAULT '[]',
    includes TEXT DEFAULT '[]',
    excludes TEXT DEFAULT '[]',
    rating REAL DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    package_id INTEGER,
    package_title TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    travel_date TEXT,
    travelers INTEGER DEFAULT 1,
    total_price REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    payment_ref TEXT,
    notes TEXT DEFAULT '',
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (package_id) REFERENCES packages(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS visa_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_ref TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    country TEXT NOT NULL,
    nationality TEXT,
    purpose TEXT,
    status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'in_review', 'approved', 'rejected')),
    assessment_json TEXT DEFAULT '{}',
    documents_json TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    subject TEXT DEFAULT 'general',
    message TEXT NOT NULL,
    type TEXT DEFAULT 'contact',
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'replied', 'closed')),
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS flight_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    depart_date TEXT,
    return_date TEXT,
    passengers INTEGER DEFAULT 1,
    class TEXT DEFAULT 'economy',
    trip_type TEXT DEFAULT 'return',
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'quoted', 'accepted', 'rejected', 'completed')),
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    service_type TEXT NOT NULL CHECK(service_type IN ('visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other')),
    country TEXT DEFAULT '',
    details_json TEXT DEFAULT '{}',
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'accepted', 'in_progress', 'completed', 'rejected')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to INTEGER,
    admin_notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT DEFAULT '',
    region TEXT DEFAULT 'europe',
    visa_required INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    cover_image TEXT,
    author TEXT DEFAULT 'Borderless Trips',
    category TEXT DEFAULT 'Travel Guide',
    published INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    photo TEXT,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('customer', 'admin')),
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    link TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT NOT NULL CHECK(service_type IN ('visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other')),
    country TEXT DEFAULT '',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    required INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS flight_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    price TEXT NOT NULL,
    airline TEXT DEFAULT 'Multiple Airlines',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed flight_rates if empty
try {
  const count = db.prepare("SELECT COUNT(*) as count FROM flight_rates").get().count;
  if (count === 0) {
    console.log('🌱 Seeding default flight rates...');
    const defaultRates = [
      { from_city: 'London', to_city: 'Paris', price: '89', airline: 'Multiple Airlines' },
      { from_city: 'London', to_city: 'Rome', price: '109', airline: 'Multiple Airlines' },
      { from_city: 'London', to_city: 'Barcelona', price: '79', airline: 'Multiple Airlines' },
      { from_city: 'London', to_city: 'Amsterdam', price: '69', airline: 'Multiple Airlines' },
      { from_city: 'London', to_city: 'Istanbul', price: '149', airline: 'Multiple Airlines' },
      { from_city: 'London', to_city: 'Dubai', price: '299', airline: 'Multiple Airlines' },
      { from_city: 'Manchester', to_city: 'Paris', price: '99', airline: 'Multiple Airlines' },
      { from_city: 'Birmingham', to_city: 'Rome', price: '119', airline: 'Multiple Airlines' }
    ];
    const stmt = db.prepare('INSERT INTO flight_rates (from_city, to_city, price, airline) VALUES (?, ?, ?, ?)');
    for (const r of defaultRates) {
      stmt.run(r.from_city, r.to_city, r.price, r.airline);
    }
  }
} catch (e) {
  console.error('Error seeding flight rates:', e);
}

// -- Migrations for existing DBs: add columns if missing --
const safeAddColumn = (table, column, definition) => {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.find(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (e) { /* column already exists */ }
};

safeAddColumn('users', 'sub_role', "TEXT DEFAULT ''");
safeAddColumn('users', 'status', "TEXT DEFAULT 'active'");
safeAddColumn('bookings', 'admin_notes', "TEXT DEFAULT ''");
safeAddColumn('bookings', 'assigned_to', "INTEGER");
safeAddColumn('bookings', 'updated_at', "DATETIME");
safeAddColumn('visa_applications', 'admin_notes', "TEXT DEFAULT ''");
safeAddColumn('visa_applications', 'assigned_to', "INTEGER");
safeAddColumn('visa_applications', 'customer_phone', "TEXT DEFAULT ''");
safeAddColumn('visa_applications', 'updated_at', "DATETIME");
safeAddColumn('inquiries', 'admin_notes', "TEXT DEFAULT ''");
safeAddColumn('inquiries', 'assigned_to', "INTEGER");
safeAddColumn('inquiries', 'user_id', "INTEGER");
safeAddColumn('flight_requests', 'admin_notes', "TEXT DEFAULT ''");
safeAddColumn('flight_requests', 'assigned_to', "INTEGER");
safeAddColumn('flight_requests', 'customer_name', "TEXT DEFAULT ''");
safeAddColumn('flight_requests', 'customer_email', "TEXT DEFAULT ''");
safeAddColumn('flight_requests', 'customer_phone', "TEXT DEFAULT ''");

// New features columns
safeAddColumn('users', 'profile_photo', "TEXT DEFAULT ''");
safeAddColumn('users', 'assigned_to', "INTEGER");
['visa_applications', 'bookings', 'flight_requests'].forEach(table => {
  safeAddColumn(table, 'travelers_json', "TEXT DEFAULT '[]'");
  safeAddColumn(table, 'payment_info_json', "TEXT DEFAULT '{}'");
  safeAddColumn(table, 'payment_proof', "TEXT DEFAULT ''");
});
['visa_applications', 'bookings'].forEach(table => {
  safeAddColumn(table, 'edit_unlocked', "INTEGER DEFAULT 0");
  safeAddColumn(table, 'signature_link', "TEXT DEFAULT ''");
  safeAddColumn(table, 'signature_doc', "TEXT DEFAULT ''");
  safeAddColumn(table, 'signed_document_url', "TEXT DEFAULT ''");
  safeAddColumn(table, 'invoice_url', "TEXT DEFAULT ''");
});
['visa_applications', 'bookings', 'flight_requests', 'inquiries', 'service_requests'].forEach(table => {
  safeAddColumn(table, 'comments_json', "TEXT DEFAULT '[]'");
});

// Migrate visa_applications status constraint to include 'document_complete'
try {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='visa_applications'").get();
  if (row && row.sql && !row.sql.includes('document_complete')) {
    console.log('🔄 Migrating visa_applications table constraints to include "document_complete"...');
    
    // Check old columns to build dynamic copy statement
    db.exec("ALTER TABLE visa_applications RENAME TO temp_visa_applications;");
    
    const tempCols = db.prepare("PRAGMA table_info(temp_visa_applications)").all().map(c => c.name);
    const targetCols = [
      'id', 'app_ref', 'user_id', 'customer_name', 'customer_email', 'customer_phone',
      'country', 'nationality', 'purpose', 'status', 'assessment_json', 'documents_json',
      'notes', 'admin_notes', 'assigned_to', 'created_at', 'updated_at'
    ];
    
    const selectExprs = targetCols.map(col => {
      if (tempCols.includes(col)) {
        return col;
      } else if (col === 'updated_at') {
        return "created_at AS updated_at";
      } else if (col === 'customer_phone') {
        return "'' AS customer_phone";
      } else if (col === 'admin_notes') {
        return "'' AS admin_notes";
      } else {
        return "NULL AS " + col;
      }
    });

    db.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN TRANSACTION;
      
      CREATE TABLE visa_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_ref TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT DEFAULT '',
        country TEXT NOT NULL,
        nationality TEXT,
        purpose TEXT,
        status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'in_review', 'approved', 'rejected', 'document_complete')),
        assessment_json TEXT DEFAULT '{}',
        documents_json TEXT DEFAULT '[]',
        notes TEXT DEFAULT '',
        admin_notes TEXT DEFAULT '',
        assigned_to INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      );
      
      INSERT INTO visa_applications (${targetCols.join(', ')})
      SELECT ${selectExprs.join(', ')} FROM temp_visa_applications;
      
      DROP TABLE temp_visa_applications;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
    console.log('✅ visa_applications table migrated successfully.');
  }
} catch (err) {
  console.error('Failed to run visa_applications table status migration:', err);
  // Fallback: if we renamed but failed to create/copy, let's restore
  try {
    const tempExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='temp_visa_applications'").get();
    if (tempExists) {
      db.exec("ALTER TABLE temp_visa_applications RENAME TO visa_applications;");
    }
  } catch (restoreErr) {}
}

// Seed default document templates if empty
try {
  const templatesCount = db.prepare('SELECT COUNT(*) as count FROM document_templates').get().count;
  if (templatesCount === 0) {
    const defaultTemplates = [
      { service_type: 'visa', country: '', name: 'Passport Copy (Bio-page)', description: 'Scanned copy of the passport pages containing your details and photo.', required: 1 },
      { service_type: 'visa', country: '', name: 'Recent Passport Photo', description: 'Recent passport-sized photo with a white background.', required: 1 },
      { service_type: 'visa', country: '', name: 'Proof of Funds (Bank Statement)', description: 'Official bank statements from the last 3-6 months showing active transactions and sufficient balance.', required: 1 },
      { service_type: 'visa', country: '', name: 'Employment Letter / ID Card', description: 'No Objection Certificate (NOC) or reference letter from your employer/school, or employment contract.', required: 1 },
      { service_type: 'visa', country: '', name: 'Travel Insurance Certificate', description: 'Schengen-compliant travel medical insurance covering at least €30,000.', required: 1 },
      { service_type: 'visa', country: '', name: 'Hotel Booking Confirmation', description: 'Proof of accommodation for the entire duration of stay.', required: 0 },
      { service_type: 'visa', country: '', name: 'Flight Itinerary', description: 'Reserved flight itinerary showing travel dates.', required: 0 },
    ];
    const stmt = db.prepare('INSERT INTO document_templates (service_type, country, name, description, required) VALUES (?, ?, ?, ?, ?)');
    for (const t of defaultTemplates) {
      stmt.run(t.service_type, t.country, t.name, t.description, t.required);
    }
    console.log('✅ Default document templates seeded.');
  }
} catch (err) {
  console.error('Failed to seed document templates:', err);
}

// Seed admin user if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password_hash, role, sub_role) VALUES (?, ?, ?, ?, ?)').run(
    'Admin', 'admin@borderlesstrips.com', hash, 'admin', 'manager'
  );
  console.log('✅ Default admin created: admin@borderlesstrips.com / admin123');
}

// Seed countries if empty
const countriesCount = db.prepare('SELECT COUNT(*) as count FROM countries').get().count;
if (countriesCount === 0) {
  const countries = [
    // Schengen Area (27 countries)
    { name: 'Austria', code: 'AT', region: 'schengen' },
    { name: 'Belgium', code: 'BE', region: 'schengen' },
    { name: 'Bulgaria', code: 'BG', region: 'schengen' },
    { name: 'Croatia', code: 'HR', region: 'schengen' },
    { name: 'Czech Republic', code: 'CZ', region: 'schengen' },
    { name: 'Denmark', code: 'DK', region: 'schengen' },
    { name: 'Estonia', code: 'EE', region: 'schengen' },
    { name: 'Finland', code: 'FI', region: 'schengen' },
    { name: 'France', code: 'FR', region: 'schengen' },
    { name: 'Germany', code: 'DE', region: 'schengen' },
    { name: 'Greece', code: 'GR', region: 'schengen' },
    { name: 'Hungary', code: 'HU', region: 'schengen' },
    { name: 'Iceland', code: 'IS', region: 'schengen' },
    { name: 'Italy', code: 'IT', region: 'schengen' },
    { name: 'Latvia', code: 'LV', region: 'schengen' },
    { name: 'Liechtenstein', code: 'LI', region: 'schengen' },
    { name: 'Lithuania', code: 'LT', region: 'schengen' },
    { name: 'Luxembourg', code: 'LU', region: 'schengen' },
    { name: 'Malta', code: 'MT', region: 'schengen' },
    { name: 'Netherlands', code: 'NL', region: 'schengen' },
    { name: 'Norway', code: 'NO', region: 'schengen' },
    { name: 'Poland', code: 'PL', region: 'schengen' },
    { name: 'Portugal', code: 'PT', region: 'schengen' },
    { name: 'Romania', code: 'RO', region: 'schengen' },
    { name: 'Slovakia', code: 'SK', region: 'schengen' },
    { name: 'Slovenia', code: 'SI', region: 'schengen' },
    { name: 'Spain', code: 'ES', region: 'schengen' },
    { name: 'Sweden', code: 'SE', region: 'schengen' },
    { name: 'Switzerland', code: 'CH', region: 'schengen' },
    // Popular non-Schengen destinations
    { name: 'Turkey', code: 'TR', region: 'europe' },
    { name: 'United Kingdom', code: 'GB', region: 'europe' },
    { name: 'United Arab Emirates', code: 'AE', region: 'middle_east' },
    { name: 'Thailand', code: 'TH', region: 'asia' },
    { name: 'Malaysia', code: 'MY', region: 'asia' },
    { name: 'Maldives', code: 'MV', region: 'asia' },
    { name: 'Egypt', code: 'EG', region: 'africa' },
    { name: 'Morocco', code: 'MA', region: 'africa' },
    { name: 'Japan', code: 'JP', region: 'asia' },
    { name: 'South Korea', code: 'KR', region: 'asia' },
    { name: 'United States', code: 'US', region: 'americas' },
    { name: 'Canada', code: 'CA', region: 'americas' },
    { name: 'Australia', code: 'AU', region: 'oceania' },
    { name: 'New Zealand', code: 'NZ', region: 'oceania' },
    { name: 'Saudi Arabia', code: 'SA', region: 'middle_east' },
  ];

  const stmt = db.prepare('INSERT INTO countries (name, code, region, visa_required, active) VALUES (?, ?, ?, 1, 1)');
  for (const c of countries) {
    stmt.run(c.name, c.code, c.region);
  }
  console.log(`✅ ${countries.length} countries seeded.`);
}

// Seed default business settings
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
if (settingsCount === 0) {
  const defaults = {
    business_name: 'Borderless Trips',
    phone: '+44 123 456 7890',
    email: 'info@borderlesstrips.com',
    whatsapp: '+441234567890',
    bank_name: 'Barclays',
    account_name: 'Borderless Trips Ltd',
    sort_code: '20-XX-XX',
    account_number: 'XXXXXXXX',
    address: 'London, United Kingdom',
    currency: 'GBP'
  };
  const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaults)) {
    stmt.run(key, value);
  }
  console.log('✅ Default business settings seeded.');
}

// Safely seed individual settings keys if they do not exist
const safeAddSetting = (key, defaultValue) => {
  try {
    const exists = db.prepare('SELECT 1 FROM settings WHERE key = ?').get(key);
    if (!exists) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, defaultValue);
      console.log(`🌱 Added default setting key: ${key}`);
    }
  } catch (e) {
    console.error(`Failed to add setting key ${key}:`, e);
  }
};

safeAddSetting('logo_url', '/logo.png');
safeAddSetting('hero_images', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80, https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80, https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80, https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80, https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80');
safeAddSetting('hero_video', 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27d23d8c1ad2125e98583fb24285e683f491176&profile_id=165&oauth2_token_id=57447761');

// Seed premium packages if table is empty
const packagesCount = db.prepare('SELECT COUNT(*) as count FROM packages').get().count;
if (packagesCount === 0) {
  const initialPackages = [
    {
      title: 'Romantic Paris & Seine Experience',
      destination: 'France',
      description: 'Experience the magic of Paris, from sunset cruises on the Seine to private tours of the Louvre and high culinary dining. Perfect for couples looking for an unforgettable getaway.',
      duration: '5 Days / 4 Nights',
      price: 799.0,
      original_price: 999.0,
      type: 'romance',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80'
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: 'Arrival & Seine Dinner Cruise', details: 'Arrive in Paris, transfer to your boutique hotel. In the evening, enjoy a 3-course dinner cruise along the Seine with live music.' },
        { day: 2, title: 'Louvre Museum & Eiffel Tower', details: 'Skip-the-line morning tour of the Louvre. Afternoon at leisure, followed by sunset access to the top tier of the Eiffel Tower.' },
        { day: 3, title: 'Palace of Versailles Tour', details: 'Guided half-day excursion to the royal Palace of Versailles, including the Hall of Mirrors and the expansive gardens.' },
        { day: 4, title: 'Montmartre & Wine Tasting', details: 'Explore the artistic history of Montmartre and Sacré-Cœur, ending with a private wine tasting session at a local cellar.' },
        { day: 5, title: 'Departure', details: 'Bid au revoir to Paris. Private transfer to the airport or train station.' }
      ]),
      includes: JSON.stringify([
        '4 nights accommodation in a 4-star boutique hotel',
        'Daily gourmet breakfast',
        'Seine River dinner cruise ticket',
        'Skip-the-line tickets to Louvre and Eiffel Tower',
        'Airport round-trip private transfers'
      ]),
      excludes: JSON.stringify([
        'International flights',
        'Travel insurance',
        'Schengen Visa processing fee (£150)',
        'Personal expenses and lunches'
      ]),
      rating: 4.8,
      reviews: 42,
      featured: 1,
      active: 1
    },
    {
      title: 'Amalfi Coast Luxury Escape',
      destination: 'Italy',
      description: 'Soak up the Italian sun in Positano, Capri, and Ravello. Live the sweet life with luxury cliffside hotels, private yachts, and authentic cooking masterclasses.',
      duration: '7 Days / 6 Nights',
      price: 1499.0,
      original_price: 1899.0,
      type: 'luxury',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?auto=format&fit=crop&w=800&q=80'
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: 'Rome to Positano Cliffside Hotel', details: 'Private chauffeur transfer from Rome. Check into your luxury room overlooking the Positano bay.' },
        { day: 2, title: 'Capri Yacht Cruise & Blue Grotto', details: 'Board your private yacht to Capri. Cruise around the Faraglioni rocks, visit the Blue Grotto and enjoy lunch in Anacapri.' },
        { day: 3, title: 'Amalfi & Ravello Excursion', details: 'Drive along the iconic coastal road. Tour the historic town of Amalfi and visit the stunning cliffside gardens of Villa Rufolo in Ravello.' },
        { day: 4, title: 'Beach Club Leisure Day', details: 'Enjoy a reserved VIP sunbed at a premier beach club. Cocktails and Mediterranean seafood lunch included.' },
        { day: 5, title: 'Pompeii Guided Tour', details: 'Skip-the-line private tour of the Pompeii ruins. Evening leisure time in Sorrento.' },
        { day: 6, title: 'Sorrento Cooking Masterclass', details: 'Learn to make fresh pasta, limoncello, and tiramisu with a local Michelin-star chef at a coastal estate.' },
        { day: 7, title: 'Departure', details: 'Transfer back to Rome Airport for your flight home.' }
      ]),
      includes: JSON.stringify([
        '6 nights in premium cliff-view hotels',
        'Private yacht day cruise to Capri',
        'Private chauffeured transfers throughout',
        'All entry tickets including Pompeii and Gardens',
        'Sorrento cooking class and Amalfi seafood lunch'
      ]),
      excludes: JSON.stringify([
        'Flights to Rome',
        'Visa fees',
        'Tourist city tax'
      ]),
      rating: 4.9,
      reviews: 28,
      featured: 1,
      active: 1
    },
    {
      title: 'Swiss Alps Adventure & Nature',
      destination: 'Switzerland',
      description: 'Climb the Top of Europe, ride scenic trains, and conquer glacier summits. An exhilarating journey through Interlaken, Grindelwald, and Zermatt.',
      duration: '6 Days / 5 Nights',
      price: 1299.0,
      original_price: 1599.0,
      type: 'adventure',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: 'Zurich to Scenic Interlaken', details: 'Board the Swiss Rail (1st Class) to Interlaken. Check in at a luxury chalet-style resort with lake views.' },
        { day: 2, title: 'Jungfraujoch: Top of Europe', details: 'Ride the Eiger Express cable car and cogwheel train up to 3,454m. Tour the Ice Palace and Sphinx Observatory.' },
        { day: 3, title: 'Grindelwald First Mountain Adventure', details: 'Enjoy activities like the Cliff Walk, First Flyer zip-line, and alpine hiking. End with traditional Swiss fondue dinner.' },
        { day: 4, title: 'Scenic GoldenPass Express to Zermatt', details: 'Panoramic train ride through the heart of the Alps to Zermatt, the car-free mountain village under the Matterhorn.' },
        { day: 5, title: 'Matterhorn Glacier Paradise', details: 'Cable car ride to Europe highest station. Skiing, snow tubing, and panoramic views of French, Swiss, and Italian peaks.' },
        { day: 6, title: 'Return Transfer', details: '1st Class rail ticket back to Zurich Airport for departure.' }
      ]),
      includes: JSON.stringify([
        '5 nights accommodation in 5-star mountain lodges',
        'Swiss Travel Pass (1st Class, 8 days)',
        'Full excursions to Jungfraujoch & Glacier Paradise',
        'Daily Swiss buffet breakfast',
        'Specialty cheese fondue dinner'
      ]),
      excludes: JSON.stringify([
        'Flights to Switzerland',
        'Rental of winter/skiing gear',
        'Personal guides'
      ]),
      rating: 4.7,
      reviews: 19,
      featured: 1,
      active: 1
    },
    {
      title: 'Spanish Fiesta: Barcelona & Madrid',
      destination: 'Spain',
      description: 'Discover the rich art, architecture, and street life of Spain. Marvel at Gaudi works, taste authentic tapas, and travel by high-speed AVE train.',
      duration: '8 Days / 7 Nights',
      price: 999.0,
      original_price: 1199.0,
      type: 'culture',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583779457094-0e0f548d8b97?auto=format&fit=crop&w=800&q=80'
      ]),
      itinerary: JSON.stringify([
        { day: 1, title: 'Welcome to Barcelona', details: 'Private transfer to your hotel. Evening tapas-tour in El Born neighborhood.' },
        { day: 2, title: 'Gaudi Architecture Tour', details: 'Guided skip-the-line visits to Sagrada Família and Park Güell. Walk along Passeig de Gràcia.' },
        { day: 3, title: 'Gothic Quarter & Beach Club', details: 'Walk through the historical Gothic Quarter, and spend the afternoon at Barcelona beach.' },
        { day: 4, title: 'AVE High-Speed Train to Madrid', details: '2.5 hour bullet train ride in Club Class to Madrid. Evening walk around Puerta del Sol.' },
        { day: 5, title: 'Royal Palace & Prado Art Museum', details: 'Morning tour of the majestic Royal Palace, followed by Prado Museum access.' },
        { day: 6, title: 'Toledo Medieval Day Excursion', details: 'Day trip to Toledo, the city of three cultures. Explore the old synagogues, cathedrals, and armor shops.' },
        { day: 7, title: 'Flamenco Show & Farewell Dinner', details: 'Watch an authentic Flamenco performance at a historic taberna with a grand Spanish dinner.' },
        { day: 8, title: 'Farewell Madrid', details: 'Transfer to Madrid Barajas Airport for your flight.' }
      ]),
      includes: JSON.stringify([
        '7 nights in centrally-located 4-star hotels',
        'High-speed AVE train ticket (Barcelona - Madrid)',
        'Skip-the-line tickets for Sagrada Familia and Prado Museum',
        'Tapas tour and Flamenco show with dinner',
        'Private airport transfers'
      ]),
      excludes: JSON.stringify([
        'Flights to Spain',
        'Visa costs',
        'Public transit tickets'
      ]),
      rating: 4.8,
      reviews: 35,
      featured: 0,
      active: 1
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO packages (
      title, destination, description, duration, price, original_price,
      type, images, itinerary, includes, excludes, rating, reviews, featured, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const pkg of initialPackages) {
    stmt.run(
      pkg.title, pkg.destination, pkg.description, pkg.duration,
      pkg.price, pkg.original_price, pkg.type, pkg.images,
      pkg.itinerary, pkg.includes, pkg.excludes,
      pkg.rating, pkg.reviews, pkg.featured, pkg.active
    );
  }
  console.log('✅ 4 premium packages seeded in database.');
}

module.exports = db;
