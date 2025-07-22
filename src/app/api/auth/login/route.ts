import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect to Google OAuth URL
  
  const googleOAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=openid%20profile%20email`;
  
  return NextResponse.redirect(googleOAuthURL);
}
