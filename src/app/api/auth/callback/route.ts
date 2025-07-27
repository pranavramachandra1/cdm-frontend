import { NextRequest, NextResponse } from 'next/server';
import { getUserWithGoogleID, createUser, type UserCreate } from '@/lib/users';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=access_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // Exchange code for tokens with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser: GoogleUserInfo = await userResponse.json();

    // Check internally if user exists
    const google_id = googleUser.id; // Fixed: user is an object, not a Map
    let verified_user = await getUserWithGoogleID(google_id); // Fixed: Added await

    if (!verified_user) {
      const user_doc: UserCreate = {
        username: googleUser.email.split('@')[0], // Generate username from email
        email: googleUser.email,
        password: "",
        phone_number: "",
        first_name: googleUser.given_name || '',
        last_name: googleUser.family_name || '',
        google_id: google_id,
      };
      
      // Create the user
      verified_user = await createUser(user_doc);
    }

    // Create comprehensive session data with both Google info and verified user data
    const sessionData = {
      google: googleUser,
      user: verified_user,
      isNewUser: !verified_user, // Will be false since we either found or created user
    };

    // Set user session/cookie with complete session data
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('user_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}