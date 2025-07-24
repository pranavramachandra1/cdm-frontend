import { NextRequest, NextResponse } from 'next/server';
import { getCurrentListTasks } from '@/lib/tasks';

export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const result = await getCurrentListTasks(params.listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get current list tasks' },
      { status: 404 }
    );
  }
}