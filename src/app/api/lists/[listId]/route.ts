import { NextRequest, NextResponse } from 'next/server';
import { getList, updateList, deleteList } from '@/lib/lists';

export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const result = await getList(params.listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get list' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const body = await request.json();
    const result = await updateList(params.listId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update list' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const result = await deleteList(params.listId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete list' },
      { status: 404 }
    );
  }
}