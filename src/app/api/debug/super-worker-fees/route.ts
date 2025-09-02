import { NextRequest, NextResponse } from 'next/server';
import { checkSuperWorkerFeesTable, fetchSuperWorkerFees } from '@/lib/actions';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug endpoint called');
    
    // Check table status
    const tableStatus = await checkSuperWorkerFeesTable();
    console.log('Table status:', tableStatus);
    
    let fees: any[] = [];
    let feesError: string | null = null;
    
    try {
      fees = await fetchSuperWorkerFees();
      console.log('Fees fetched successfully:', fees.length, 'records');
    } catch (error) {
      feesError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching fees:', feesError);
    }
    
    return NextResponse.json({
      tableStatus,
      fees,
      feesError,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}