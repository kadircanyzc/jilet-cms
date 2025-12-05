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
  const authToken = request.cookies.get('__session')?.value
  const firebaseToken = request.cookies.get('firebase-auth-token')?.value

  // Debug: Log all cookies
  console.log('🔍 Middleware check for:', pathname)
  console.log('🍪 Cookies:', {
    __session: authToken ? 'present' : 'missing',
    'firebase-auth-token': firebaseToken ? 'present' : 'missing',
    all: Array.from(request.cookies.getAll().map(c => c.name))
  })

  // Check for the presence of any Firebase auth cookies
  const hasFirebaseAuth = authToken || firebaseToken

  // If no auth token found, redirect to login
  if (!hasFirebaseAuth) {
    console.log('❌ No auth token found, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('✅ Auth token found, allowing request')
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
