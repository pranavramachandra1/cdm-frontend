import { NextRequest, NextResponse } from 'next/server';
import { getTasksFromListVersion } from '@/lib/tasks';

export async function GET(
  _request: NextRequest,
  { params }: { params: { listId: string, listRequestVersion: string } }
) {
  try {
    const listRequestVersion = parseInt(params.listRequestVersion);
    
    if (isNaN(listRequestVersion)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

    const result = await getTasksFromListVersion(params.listId, listRequestVersion);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get tasks from list version' },
      { status: 400 }
    );
  }
}