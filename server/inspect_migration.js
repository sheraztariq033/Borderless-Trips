const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'borderless.db');
const db = new Database(dbPath);

console.log("Simulating full migration...");

try {
  db.exec("PRAGMA foreign_keys = OFF;");
  db.exec("BEGIN TRANSACTION;");
  
  db.exec("ALTER TABLE visa_applications RENAME TO temp_visa_applications;");
  console.log("Renamed to temp_visa_applications successfully.");

  db.exec(`
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
  `);
  console.log("Created new visa_applications successfully.");

  const tempCols = db.prepare("PRAGMA table_info(temp_visa_applications)").all().map(c => c.name);
  console.log("tempCols:", tempCols);
  
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

  const query = `
    INSERT INTO visa_applications (${targetCols.join(', ')})
    SELECT ${selectExprs.join(', ')} FROM temp_visa_applications;
  `;
  console.log("Generated query:", query);

  db.exec(query);
  console.log("Inserted data successfully.");

  db.exec("DROP TABLE temp_visa_applications;");
  console.log("Dropped temp table successfully.");

  db.exec("COMMIT;");
  console.log("Transaction committed successfully!");
} catch(e) {
  console.error("Migration failed:", e.message);
  try {
    db.exec("ROLLBACK;");
  } catch(re) {}
} finally {
  db.exec("PRAGMA foreign_keys = ON;");
  db.close();
}
