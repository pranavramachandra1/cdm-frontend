import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Clear user session cookie
  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.delete('user');
  
  return response;
}
