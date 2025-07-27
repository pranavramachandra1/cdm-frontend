import { NextRequest, NextResponse } from 'next/server';
import { getUserWithGoogleID } from '@/lib/users'

// GET /api/users/[user_id] - Get a specific user from backend
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const google_id = url.searchParams.get("google_id");
    console.log(google_id);
    
    if (!google_id || google_id === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const backendResponse = await getUserWithGoogleID(google_id);
    
    if (!backendResponse) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(backendResponse);
    
    return NextResponse.json(backendResponse, { status: 200 });
  } catch (error) {
    console.error('Error communicating with backend:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}