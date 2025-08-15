
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Mock authentication - replace with real auth
    if (email === 'admin@musicu.com' && password === 'MusicU2025') {
      // Set a simple session cookie
      const response = NextResponse.redirect(new URL('/admin', request.url))
      response.cookies.set('session', 'admin-session', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      return response
    }

    // Default redirect to dashboard for any other credentials (for testing)
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    response.cookies.set('session', 'user-session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
