const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'partiful.db');
const db = new Database(dbPath);

try {
  // Check if title column exists
  const tableInfo = db.prepare("PRAGMA table_info(photos)").all();
  const hasTitle = tableInfo.some(col => col.name === 'title');
  
  if (!hasTitle) {
    db.exec('ALTER TABLE photos ADD COLUMN title TEXT');
  // console.log('✅ Migration complete: Added title column to photos table'); // debug disabled for deployment
  } else {
  // console.log('✅ Title column already exists'); // debug disabled for deployment
  }
} catch (error) {
  // console.error('❌ Migration failed:', error); // debug disabled for deployment
} finally {
  db.close();
}
