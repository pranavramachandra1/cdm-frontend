import { NextRequest, NextResponse } from 'next/server';
import { toggleTaskPriority } from '@/lib/tasks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const result = await toggleTaskPriority(params.taskId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle task priority' },
      { status: 400 }
    );
  }
}