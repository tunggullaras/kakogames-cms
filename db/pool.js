const { Pool } = require('pg');
require('dotenv').config();

// Works with plain Postgres or Supabase's Postgres connection string.
// Set DATABASE_URL in your .env file, e.g.:
// DATABASE_URL=postgresql://user:password@host:5432/dbname
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = pool;
