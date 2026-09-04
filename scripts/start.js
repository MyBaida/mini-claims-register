import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data.db');
const isNewDatabase = !fs.existsSync(dbPath);

// CREATE TABLE IF NOT EXISTS 
// makes this safe to run every time.
execSync('node scripts/init-db.js', { stdio: 'inherit' });

if (isNewDatabase) {
  console.log('No existing database found — seeding sample data.');
  execSync('node scripts/seed.js', { stdio: 'inherit' });
} else {
  console.log('Existing database found — skipping seed.');
}

execSync('npm run start', { stdio: 'inherit' });