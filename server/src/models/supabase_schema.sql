-- Borderless Trips 2.0 - Supabase PostgreSQL Schema Definition
-- Copy and paste this script into the Supabase SQL Editor (https://supabase.com)

-- 1. Enable UUID Extension (Optional, useful if you want to switch to UUIDs later)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
    sub_role TEXT DEFAULT '',
    assigned_to INTEGER,
    phone TEXT DEFAULT '',
    nationality TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    profile_photo TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Document Folders Table
CREATE TABLE IF NOT EXISTS document_folders (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Document Templates Table
CREATE TABLE IF NOT EXISTS document_templates (
    id SERIAL PRIMARY KEY,
    service_type TEXT NOT NULL CHECK(service_type IN ('visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other')),
    country TEXT DEFAULT '',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    required INTEGER DEFAULT 1,
    folder_id INTEGER REFERENCES document_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_ref TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    package_id INTEGER,
    package_title TEXT NOT NULL,
    travel_date TEXT DEFAULT '',
    travelers INTEGER DEFAULT 1,
    total_price NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'partial', 'paid')),
    payment_ref TEXT DEFAULT '',
    payment_proof TEXT DEFAULT '',
    signature_link TEXT DEFAULT '',
    signature_doc TEXT DEFAULT '',
    signed_document_url TEXT DEFAULT '',
    travelers_json TEXT DEFAULT '[]',     -- Stored as JSON string or parsed array
    payment_info_json TEXT DEFAULT '[]',   -- Stored as JSON string or parsed array
    comments_json TEXT DEFAULT '[]',       -- Stored as JSON string or parsed array
    notes TEXT DEFAULT '',
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invoice_url TEXT DEFAULT '',
    edit_unlocked INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Visa Applications Table
CREATE TABLE IF NOT EXISTS visa_applications (
    id SERIAL PRIMARY KEY,
    app_ref TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    country TEXT NOT NULL,
    nationality TEXT DEFAULT '',
    purpose TEXT DEFAULT 'tourism',
    status TEXT DEFAULT 'submitted' CHECK(status IN (
      'submitted', 'in_review', 'approved', 'rejected', 'document_complete',
      'fee_processing', 'embassy_submitted', 'interview_scheduled',
      'visa_successful', 'visa_refused'
    )),
    assessment_json TEXT DEFAULT '{}',
    documents_json TEXT DEFAULT '[]',
    notes TEXT DEFAULT '',
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invoice_url TEXT DEFAULT '',
    edit_unlocked INTEGER DEFAULT 0,
    signature_link TEXT DEFAULT '',
    signature_doc TEXT DEFAULT '',
    signed_document_url TEXT DEFAULT '',
    payment_proof TEXT DEFAULT '',
    travelers_json TEXT DEFAULT '[]',
    payment_info_json TEXT DEFAULT '[]',
    comments_json TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 8. Flight Rates Table
CREATE TABLE IF NOT EXISTS flight_rates (
    id SERIAL PRIMARY KEY,
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    price TEXT NOT NULL,
    airline TEXT DEFAULT 'Multiple Airlines',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    details TEXT DEFAULT '',
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'completed', 'cancelled')),
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Flight Requests Table
CREATE TABLE IF NOT EXISTS flight_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    depart_date TEXT NOT NULL,
    return_date TEXT DEFAULT '',
    passengers INTEGER DEFAULT 1,
    class TEXT DEFAULT 'economy',
    trip_type TEXT DEFAULT 'round-trip',
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'quoted', 'booked', 'cancelled')),
    admin_notes TEXT DEFAULT '',
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'system',
    ref TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    type TEXT DEFAULT 'adventure',
    images TEXT DEFAULT '[]',
    itinerary TEXT DEFAULT '[]',
    includes TEXT DEFAULT '[]',
    excludes TEXT DEFAULT '[]',
    rating NUMERIC(3, 2) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    cover_image TEXT,
    author TEXT DEFAULT 'Borderless Trips',
    category TEXT DEFAULT 'Travel Guide',
    published INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    text TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    photo TEXT,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK(sender IN ('customer', 'admin')),
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    ref TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    service_type TEXT NOT NULL CHECK(service_type IN ('visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other')),
    country TEXT DEFAULT '',
    details_json TEXT DEFAULT '{}',
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'accepted', 'in_progress', 'completed', 'rejected')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT DEFAULT '',
    comments_json TEXT DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Countries Table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT DEFAULT '',
    region TEXT DEFAULT 'europe',
    visa_required INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Default Templates (Run these after database creation)
INSERT INTO document_templates (service_type, country, name, description, required) 
VALUES 
('visa', '', 'Passport Copy (Bio-page)', 'Scanned copy of the passport pages containing your details and photo.', 1),
('visa', '', 'Recent Passport Photo', 'Recent passport-sized photo with a white background.', 1),
('visa', '', 'Proof of Funds (Bank Statement)', 'Official bank statements from the last 3-6 months showing active transactions and sufficient balance.', 1),
('visa', '', 'Employment Letter / ID Card', 'No Objection Certificate (NOC) or reference letter from your employer/school, or employment contract.', 1),
('visa', '', 'Travel Insurance Certificate', 'Schengen-compliant travel medical insurance covering at least €30,000.', 1),
('visa', '', 'Hotel Booking Confirmation', 'Proof of accommodation for the entire duration of stay.', 0),
('visa', '', 'Flight Itinerary', 'Reserved flight itinerary showing travel dates.', 0)
ON CONFLICT DO NOTHING;
