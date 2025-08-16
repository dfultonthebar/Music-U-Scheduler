
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = request.cookies.get('session')
  
  if (!session) {
    return NextResponse.json({ user: null })
  }

  // Mock user data based on session
  if (session.value === 'admin-session') {
    return NextResponse.json({
      user: {
        id: '1',
        name: 'Music U Admin',
        email: 'admin@musicu.com',
        role: 'admin'
      }
    })
  }

  return NextResponse.json({
    user: {
      id: '2',
      name: 'User',
      email: 'user@musicu.com',
      role: 'student'
    }
  })
}
