import { NextRequest, NextResponse } from 'next/server';
import { runSuperWorkerFeesMigration } from '@/lib/actions';

export async function POST(request: NextRequest) {
  try {
    // You might want to add authentication here to ensure only admins can run migrations
    // const { user } = await authenticate(request);
    // if (!user || user.role !== 'super_agent') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await runSuperWorkerFeesMigration();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration endpoint error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}