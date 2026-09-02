import db from '../src/lib/db.js';
import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

db.exec(schema);

console.log('Database initialized: claims and payments tables ready.');