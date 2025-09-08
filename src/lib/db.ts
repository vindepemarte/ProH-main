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
      // Optimize connection pool for performance
      max: 20, // Maximum number of clients in the pool
      min: 2,  // Minimum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
      maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      allowExitOnIdle: true, // Allow the pool to close all connections and exit when all clients are idle
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