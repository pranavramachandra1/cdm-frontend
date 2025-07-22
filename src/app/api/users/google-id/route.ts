import { NextRequest, NextResponse } from 'next/server';
import { getUserWithGoogleID } from '@/lib/users'

// GET /api/users/[user_id] - Get a specific user from backend
export async function GET(request: NextRequest) {
  try {
    // Extract user_id from URL path
    const url = new URL(request.url);
    let google_id = url.searchParams.get("google_id")

    console.log(google_id)

    if (!google_id || google_id === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendResponse = await getUserWithGoogleID(google_id=google_id);
    // Get the response data from backend (could be success or error)
    console.log(backendResponse)
    // const data = await backendResponse.json();
    // console.log(data)

    // Pass through the exact response from backend
    return NextResponse.json(backendResponse, { status: backendResponse.status });

  } catch (error) {
    console.error('Error communicating with backend:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}