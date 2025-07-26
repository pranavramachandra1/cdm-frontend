import { NextRequest, NextResponse } from 'next/server';
import { getTask, updateTask, deleteTask } from '@/lib/tasks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    console.log(`🔍 API route received taskId: ${taskId}`);
    
    const result = await getTask(taskId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Get task failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get task' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    console.log(`🔍 API route received taskId: ${taskId}`);
    
    const body = await request.json();
    console.log('🔍 API Route received update data:', body);
    
    const result = await updateTask(taskId, body);
    console.log('✅ Task updated successfully:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Task update failed:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    console.log(`🔍 API route received taskId for deletion: ${taskId}`);
    
    const result = await deleteTask(taskId);
    console.log('✅ Task deleted successfully:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Task deletion failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 404 }
    );
  }
}