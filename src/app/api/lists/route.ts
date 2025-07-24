import { NextRequest, NextResponse } from 'next/server';
import { createList, getAllLists } from '@/lib/lists';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createList(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create list' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '100');
    const userId = searchParams.get('user_id') || undefined;

    const result = await getAllLists(skip, limit, userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get lists' },
      { status: 400 }
    );
  }
}