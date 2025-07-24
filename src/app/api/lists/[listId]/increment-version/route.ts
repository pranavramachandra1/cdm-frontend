import { NextRequest, NextResponse } from 'next/server';
import { incrementListVersion } from '@/lib/lists';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const result = await incrementListVersion(params.listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to increment list version' },
      { status: 404 }
    );
  }
}