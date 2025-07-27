import { NextRequest, NextResponse } from 'next/server';
import { getTasksFromListVersion } from '@/lib/tasks';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string, listRequestVersion: string }> }
) {
  try {
    // First, await the params to get the actual values
    const { listId, listRequestVersion: listRequestVersionString } = await params;
    
    // Then parse the version number
    const listRequestVersion = parseInt(listRequestVersionString);
    if (isNaN(listRequestVersion)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

    // Use the destructured values
    const result = await getTasksFromListVersion(listId, listRequestVersion);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tasks from list version' },
      { status: 400 }
    );
  }
}