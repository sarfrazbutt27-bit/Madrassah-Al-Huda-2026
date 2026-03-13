
import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database('madrassah.db');

// Initialize database with schema
const sqlFiles = [
  'supabase_setup.sql',
  'qaida_noorania_setup.sql',
  'seed_qaida_content.sql',
  'seed_main_data.sql'
];

function adaptPostgresToSqlite(sql: string) {
  return sql
    // 1. Handle Postgres blocks (DO $$ ... END $$;) - MUST BE FIRST
    .replace(/DO \$\$[\s\S]*?END \$\$;/g, '-- Postgres block removed')
    
    // 2. Handle RLS and Policies (Remove them entirely)
    .replace(/ALTER TABLE [^\n\r]* ENABLE ROW LEVEL SECURITY;/g, '-- RLS removed')
    .replace(/CREATE POLICY [\s\S]*? ON [\s\S]*?;/g, '-- Policy removed')
    .replace(/DROP POLICY [\s\S]*? ON [\s\S]*?;/g, '-- Policy removed')
    .replace(/ENABLE ROW LEVEL SECURITY/g, '-- RLS removed')
    
    // 3. Handle Types and Defaults
    .replace(/TIMESTAMP WITH TIME ZONE DEFAULT NOW\(\)/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/TIMESTAMP WITH TIME ZONE/g, 'DATETIME')
    .replace(/JSONB/g, 'TEXT')
    .replace(/TEXT\[\]/g, 'TEXT') 
    .replace(/UUID/g, 'TEXT')
    .replace(/uuid_generate_v4\(\)/g, "(hex(randomblob(16)))")
    .replace(/gen_random_uuid\(\)/g, "(hex(randomblob(16)))")
    .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    
    // 4. Handle other Postgres specific syntax
    .replace(/::text/g, '') 
    .replace(/ON CONFLICT DO NOTHING/g, 'OR IGNORE')
    .replace(/OR REPLACE/g, 'OR IGNORE') // SQLite INSERT OR REPLACE is different from Postgres
    .replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP');
}

for (const file of sqlFiles) {
  const filePath = join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const schema = fs.readFileSync(filePath, 'utf8');
    const sqliteSchema = adaptPostgresToSqlite(schema);
    try {
      db.exec(sqliteSchema);
      console.log(`Database initialized with ${file}`);
    } catch (err) {
      console.error(`Error initializing database with ${file}:`, err);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // SQL API
  app.post('/api/sql', (req, res) => {
    const { query, params } = req.body;
    try {
      const stmt = db.prepare(query);
      if (query.trim().toLowerCase().startsWith('select')) {
        const rows = stmt.all(params || []);
        res.json({ success: true, data: rows });
      } else {
        const result = stmt.run(params || []);
        res.json({ success: true, data: result });
      }
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Helper for generic CRUD
  app.get('/api/data/:table', (req, res) => {
    try {
      const rows = db.prepare(`SELECT * FROM ${req.params.table}`).all();
      res.json(rows);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/data/:table', (req, res) => {
    const table = req.params.table;
    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');
    try {
      const result = db.prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`).run(values);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
