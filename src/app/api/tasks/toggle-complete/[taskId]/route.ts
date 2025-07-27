import { NextRequest, NextResponse } from 'next/server';
import { toggleTaskComplete } from '@/lib/tasks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // Await params to get the actual taskId value
    const { taskId } = await params;
    
    // Use the destructured taskId instead of params.taskId
    const result = await toggleTaskComplete(taskId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle task completion' },
      { status: 400 }
    );
  }
}