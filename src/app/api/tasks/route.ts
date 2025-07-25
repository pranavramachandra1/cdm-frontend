import { NextRequest, NextResponse } from 'next/server';
import { createTask } from '@/lib/tasks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 API Route received task data:', body);
    
    const result = await createTask(body);
    console.log('✅ Task created successfully:', result);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('❌ Task creation failed:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 400 }
    );
  }
}