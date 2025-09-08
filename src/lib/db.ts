import { Pool } from 'pg';
import 'dotenv/config'

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set.');
    }
    
    poolInstance = new Pool({
      connectionString,
    });
  }
  
  return poolInstance;
}

// Export pool as a getter function to maintain compatibility
export const pool = {
  connect: () => getPool().connect(),
  query: (text: string, params?: any[]) => getPool().query(text, params),
  end: () => getPool().end(),
};

// The setup script is now a separate concern handled by `npm run db:setup`
// and does not need to be part of the main application db connection logic.