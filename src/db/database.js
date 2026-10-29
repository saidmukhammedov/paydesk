const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

let defaultDbInstance = null;

function createDatabase(customPath) {
  const Database = require('better-sqlite3');
  const dbPath = customPath || config.DB_PATH;

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);

  db.pragma('foreign_keys = ON');

  if (dbPath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  return db;
}

function getDatabase() {
  if (!defaultDbInstance) {
    defaultDbInstance = createDatabase();
  }
  return defaultDbInstance;
}

function closeDatabase() {
  if (defaultDbInstance) {
    defaultDbInstance.close();
    defaultDbInstance = null;
  }
}

module.exports = {
  createDatabase,
  getDatabase,
  closeDatabase
};

