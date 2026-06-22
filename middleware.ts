import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const isDemo = request.cookies.get('demo')?.value === '1'

  if (isDemo && request.nextUrl.pathname.startsWith('/api/')) {
    const method = request.method.toUpperCase()
    if (method !== 'GET') {
      return NextResponse.json(
        { error: 'Read-only demo mode' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
