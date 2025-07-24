import { NextRequest, NextResponse } from 'next/server';
import { getListStats } from '@/lib/lists';

export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const result = await getListStats(params.listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get list stats' },
      { status: 404 }
    );
  }
}