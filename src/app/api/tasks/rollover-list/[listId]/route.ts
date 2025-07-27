import { NextRequest, NextResponse } from 'next/server';
import { rolloverList } from '@/lib/tasks';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const result = await rolloverList(listId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to rollover list' },
      { status: 400 }
    );
  }
}