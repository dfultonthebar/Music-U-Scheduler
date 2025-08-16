
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries()),
      cookies: request.cookies.getAll(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test backend authentication directly
    const formData = new FormData();
    formData.append('username', body.username || 'admin');
    formData.append('password', body.password || 'MusicU2025');

    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      body: formData,
    });

    const authData = response.ok ? await response.json() : null;

    return NextResponse.json({
      backendAuth: {
        status: response.status,
        ok: response.ok,
        data: authData,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Backend authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
