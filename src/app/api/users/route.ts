import { NextRequest, NextResponse } from 'next/server';
import { getUser, createUser, deleteUser, updateUser } from '@/lib/users'

// GET /api/users/[user_id] - Get a specific user from backend
export async function GET(request: NextRequest) {
  try {
    // Extract user_id from URL path
    const url = new URL(request.url);
    let user_id = url.searchParams.get("user_id")

    if (!user_id || user_id === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendResponse = await getUser(user_id=user_id);
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

// POST /api/users - Create a new user via backend
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();

    // Forward request to backend API
    const backendResponse = await createUser(userData = body)

    // Get the response data
    const data = await backendResponse.json();

    // Return the backend response with the same status code
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('Error communicating with backend:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

// PUT /api/users/[user_id] - Update a specific user via backend
export async function PUT(request: NextRequest) {
  try {
    // Extract user_id from URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    let user_id = pathSegments[pathSegments.length - 1];

    if (!user_id || user_id === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Forward request to backend API
    const backendResponse = await updateUser(user_id = user_id, userData = body);

    // Get the response data
    const data = await backendResponse.json();

    // Return the backend response with the same status code
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('Error communicating with backend:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}

// DELETE /api/users/[user_id] - Delete a specific user via backend
export async function DELETE(request: NextRequest) {
  try {
    // Extract user_id from URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const user_id = pathSegments[pathSegments.length - 1];

    if (!user_id || user_id === 'users') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Forward request to backend API
    const backendResponse = await deleteUser(user_id = user_id)

    // Get the response data
    const data = await backendResponse.json();

    // Return the backend response with the same status code
    return NextResponse.json(data, { status: backendResponse.status });

  } catch (error) {
    console.error('Error communicating with backend:', error);
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 502 }
    );
  }
}