import { NextRequest, NextResponse } from 'next/server';
import { getUserLists } from '@/lib/lists';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // ✅ IMPORTANT: Await the params first!
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    console.log('API route called with userId:', userId);

    // Validate the userId
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Call your function to get user lists
    const result = await getUserLists(userId);
    
    console.log('Successfully fetched lists:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in API route:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch user lists' },
      { status: 500 }
    );
  }
}