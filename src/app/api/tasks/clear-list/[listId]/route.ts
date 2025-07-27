import { NextRequest, NextResponse } from 'next/server';
import { clearListTasks } from '@/lib/tasks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const result = await clearListTasks(listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear list tasks' },
      { status: 400 }
    );
  }
}