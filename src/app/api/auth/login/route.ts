import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectParam = searchParams.get('redirect');
  
  // Build Google OAuth URL with state parameter to preserve redirect
  const state = redirectParam ? encodeURIComponent(redirectParam) : '';
  
  const googleOAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=openid%20profile%20email` +
    (state ? `&state=${state}` : '');
  
  return NextResponse.redirect(googleOAuthURL);
}
