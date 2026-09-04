import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');

// CREATE TABLE IF NOT EXISTS 
// makes this safe to run every time.
execSync('node scripts/init-db.js', { stdio: 'inherit' });

const db = new Database(dbPath);
const { count } = db.prepare('SELECT COUNT(*) as count FROM claims').get();
db.close();

if (count === 0) {
  console.log('Claims table is empty — seeding sample data.');
  execSync('node scripts/seed.js', { stdio: 'inherit' });
} else {
  console.log(`Claims table already has ${count} claim(s) — skipping seed.`);
}

execSync('npm run start', { stdio: 'inherit' });