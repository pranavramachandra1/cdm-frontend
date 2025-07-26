import { NextRequest, NextResponse } from 'next/server';
import { getCurrentListTasks } from '@/lib/tasks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    // ✅ IMPORTANT: Await the params first!
    const resolvedParams = await params;
    const listId = resolvedParams.listId;
    
    console.log(`🔍 API route received listId: ${listId}`);
    
    if (!listId) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      );
    }
    
    const result = await getCurrentListTasks(listId);
    console.log(`✅ Successfully fetched ${result.length} tasks for list ${listId}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get current list tasks' },
      { status: 404 }
    );
  }
}