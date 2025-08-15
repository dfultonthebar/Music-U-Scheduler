
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'music-u-scheduler-frontend',
    timestamp: new Date().toISOString()
  });
}
