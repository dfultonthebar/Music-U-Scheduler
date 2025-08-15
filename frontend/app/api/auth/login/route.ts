
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // Check for default admin credentials
    if (username === 'admin' && password === 'MusicU2025') {
      // Create a successful redirect response
      const redirectUrl = new URL('/admin', request.url);
      return NextResponse.redirect(redirectUrl, 302);
    }

    // For other credentials, try the backend
    try {
      const backendFormData = new FormData();
      backendFormData.append('username', username);
      backendFormData.append('password', password);

      const response = await fetch('http://localhost:8001/auth/login', {
        method: 'POST',
        body: backendFormData,
      });

      if (response.ok) {
        const userData = await response.json();
        // Redirect based on user role
        const redirectPath = userData.user?.role === 'admin' ? '/admin' : 
                           userData.user?.role === 'instructor' ? '/instructor' : 
                           '/dashboard';
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl, 302);
      }
    } catch (error) {
      console.log('Backend not available, falling back to mock authentication');
    }

    // For testing purposes, create a mock successful response
    if (username && password) {
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl, 302);
    }

    // Return error for missing credentials
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
