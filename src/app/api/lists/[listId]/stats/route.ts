import { NextRequest, NextResponse } from 'next/server';
import { getListStats } from '@/lib/lists'; // Adjust import path as needed

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const result = await getListStats(listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get list stats' },
      { status: 404 }
    );
  }
}