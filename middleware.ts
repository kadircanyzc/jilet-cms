import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login']

// Paths that should be accessible without auth (like API routes)
const API_PATHS = ['/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow API routes
  if (API_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('/public/')
  ) {
    return NextResponse.next()
  }

  // Check for Firebase auth token in cookies
  // Firebase sets __session cookie or custom auth token
  const authToken = request.cookies.get('__session')?.value
  const firebaseToken = request.cookies.get('firebase-auth-token')?.value

  // Also check for Firebase Auth state in localStorage (client-side only)
  // We'll check for the presence of any Firebase auth cookies
  const hasFirebaseAuth =
    authToken ||
    firebaseToken ||
    request.cookies.get('firebase:authUser:AIzaSyDvHXqfYhep4VnaoitI-I72mjG8iuhusi0:[DEFAULT]')?.value

  // If no auth token found, redirect to login
  if (!hasFirebaseAuth) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Allow authenticated requests
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
