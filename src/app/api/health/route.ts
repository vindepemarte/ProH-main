import { NextResponse } from 'next/server';

// Mark this route as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check if database URL is available
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json({ 
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: 'not_configured',
          server: 'running'
        },
        message: 'Database URL not configured'
      }, { status: 200 });
    }

    // Lazy load database pool to avoid build-time execution
    const { getPool } = await import('@/lib/db');
    const pool = getPool();
    
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running'
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        server: 'running'
      },
      error: 'Database connection failed'
    }, { status: 503 });
  }
}
