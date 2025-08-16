
import { NextResponse } from 'next/server';

export async function GET() {
  // Generate a simple CSRF token for testing
  const csrfToken = 'csrf-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  return NextResponse.json({ 
    csrfToken,
    timestamp: new Date().toISOString()
  });
}
