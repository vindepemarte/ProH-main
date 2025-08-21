import { Pool } from 'pg';
import 'dotenv/config'

const connectionString = process.env.POSTGRES_URL || 'postgres://postgres_happystats_user:vw80A4T6VI7kr6W46U8Vg721WYlH7pHCMbChChWp4RkrJcE2hbiYTI2Y6JRB3pud@38.242.151.194:5828/postgres';

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

export const pool = new Pool({
  connectionString,
});

// The setup script is now a separate concern handled by `npm run db:setup`
// and does not need to be part of the main application db connection logic.
