import { NextResponse } from 'next/server'

// Allow both development and production origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://evoque-six.vercel.app',
  'https://evoque.com',
]

export function getCorsHeaders(origin?: string | null) {
  // When credentials are required, we MUST specify the exact origin, not '*'
  // Browsers will reject cookies if Access-Control-Allow-Origin is '*' and credentials is 'true'
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0] // Default to first allowed origin instead of '*'
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function handleCors(origin?: string | null) {
  return new NextResponse(null, { 
    status: 200, 
    headers: getCorsHeaders(origin)
  })
}

export function addCorsHeaders(response: NextResponse, origin?: string | null) {
  const headers = getCorsHeaders(origin)
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

