import { NextResponse } from 'next/server'

export function middleware(req) {
  const session = req.cookies.get('kt_admin_session')
  const url = req.nextUrl.clone()

  // Protect /admin pages
  if (url.pathname.startsWith('/admin') && !session) {
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Protect /intimation pages (but allow /intimation/login)
  if (
    url.pathname.startsWith('/intimation') &&
    !url.pathname.startsWith('/intimation/login') &&
    !session
  ) {
    url.pathname = '/intimation/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/intimation/:path*'],
}