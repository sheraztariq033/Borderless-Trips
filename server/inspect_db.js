const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'data', 'borderless.db');
const db = new Database(dbPath);

console.log("=== USERS ===");
console.log(db.prepare("SELECT id, name, email, role, status FROM users").all());

db.close();
