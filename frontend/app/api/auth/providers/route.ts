
import { NextResponse } from 'next/server';

// Simple endpoint to satisfy authentication provider checks
export async function GET() {
  return NextResponse.json({ 
    providers: ['credentials'],
    backend: 'FastAPI',
    status: 'available'
  });
}
