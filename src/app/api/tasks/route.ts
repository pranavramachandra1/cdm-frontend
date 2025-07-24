import { NextRequest, NextResponse } from 'next/server';
import { createTask } from '@/lib/tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createTask(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 400 }
    );
  }
}