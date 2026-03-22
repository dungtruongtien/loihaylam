// CommonJS module — used by server.js (Node, not bundled by Next.js)
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'game.db');

let _db = null;

function getDb() {
  if (_db) return _db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

function initDb() {
  const db = getDb();
  const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
  db.exec(schema);
  // Migrations for columns added after initial schema
  try { db.exec("ALTER TABLE rooms ADD COLUMN game_mode TEXT NOT NULL DEFAULT 'phase'"); } catch {}
  console.log('> SQLite initialized at', DB_PATH);
}

module.exports = { getDb, initDb };
