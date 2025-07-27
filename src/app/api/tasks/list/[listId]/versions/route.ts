import { NextRequest, NextResponse } from 'next/server';
import { getListTaskVersions } from '@/lib/tasks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    // Await params to get the actual listId value
    const { listId } = await params;
    
    const { searchParams } = new URL(request.url);
    const pageStart = parseInt(searchParams.get('page_start') || '0');
    const pageEnd = parseInt(searchParams.get('page_end') || '10');
    
    // Use the destructured listId instead of params.listId
    const result = await getListTaskVersions(listId, pageStart, pageEnd);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get list task versions' },
      { status: 400 }
    );
  }
}