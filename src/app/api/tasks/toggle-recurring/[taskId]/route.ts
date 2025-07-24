import { NextRequest, NextResponse } from 'next/server';
import { toggleTaskRecurring } from '@/lib/tasks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const result = await toggleTaskRecurring(params.taskId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle task recurring' },
      { status: 400 }
    );
  }
}