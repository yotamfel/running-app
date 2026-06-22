import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  url.searchParams.delete('demo')
  const response = NextResponse.redirect(url)
  response.cookies.set('demo', '1', { path: '/', maxAge: 60 * 60 * 24 })
  return response
}
