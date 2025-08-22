import { NextRequest, NextResponse } from 'next/server';

// Helper function to create headers with API key
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (process.env.API_KEY) {
    headers['X-API-Key'] = process.env.API_KEY;
  }
  
  return headers;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string; userId: string }> }
) {
  try {
    const { shareToken, userId } = await params;
    
    console.log('🔍 Shared list API called with:', { shareToken, userId });
    
    if (!shareToken || !userId) {
      console.log('❌ Missing parameters:', { shareToken: !!shareToken, userId: !!userId });
      return NextResponse.json(
        { error: 'Share token and user ID are required' },
        { status: 400 }
      );
    }

    // Check if backend URL is configured
    if (!process.env.BACKEND_BASE_URL) {
      console.error('❌ BACKEND_BASE_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Backend configuration error' },
        { status: 500 }
      );
    }

    const backendUrl = `${process.env.BACKEND_BASE_URL}/lists/shared/${shareToken}/user/${userId}`;
    console.log('📡 Calling backend URL:', backendUrl);
    console.log('🔑 Headers:', getHeaders());

    // Call backend directly
    const response = await fetch(backendUrl, {
      headers: getHeaders(),
    });

    console.log('📨 Backend response status:', response.status);

    if (response.ok) {
      const lists = await response.json();
      console.log('✅ Backend response data:', lists);
      
      // API returns array, but we expect a single list
      const list = Array.isArray(lists) ? lists[0] : lists;
      return NextResponse.json(list);
    } else {
      const errorText = await response.text();
      console.error('❌ Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      const errorMessage = response.status === 403 
        ? "You don't have permission to view this list"
        : response.status === 404
        ? "This list doesn't exist or the link is invalid"
        : "Unable to load list. Please try again.";
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}