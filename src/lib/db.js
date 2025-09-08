const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString,
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schema);
    console.log('Database setup complete. Tables created.');
  } catch (err) {
    console.error('Error during database setup:', err);
  } finally {
    client.release();
    pool.end();
  }
}

module.exports = { pool, setupDatabase };
