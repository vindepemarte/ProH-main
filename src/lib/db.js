const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://postgres_happystats_user:vw80A4T6VI7kr6W46U8Vg721WYlH7pHCMbChChWp4RkrJcE2hbiYTI2Y6JRB3pud@38.242.151.194:5828/postgres';

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
