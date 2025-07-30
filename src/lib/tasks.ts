const BASE_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:8000';

// Helper function to create headers with API key
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (process.env.API_KEY) {
    headers['X-API-Key'] = process.env.API_KEY;
  }
  
  return headers;
};

export interface TaskCreate {
  user_id: string;
  list_id: string;
  task_name: string;
  reminders: string[];
  isPriority: boolean;
  isRecurring: boolean;
  list_version: number;
}

export interface TaskUpdate {
  user_id?: string;
  list_id?: string;
  task_id?: string;
  task_name?: string;
  reminders?: string[];
  isComplete?: boolean;
  isPriority?: boolean;
  isRecurring?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskResponse {
  user_id: string;
  list_id: string;
  task_id: string;
  task_name: string;
  reminders: string[];
  isComplete: boolean;
  isPriority: boolean;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createTask(taskData: TaskCreate): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  return response.json();
}

export async function getTask(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get task: ${response.statusText}`);
  }

  return response.json();
}

export async function updateTask(taskId: string, updateData: TaskUpdate): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update task: ${response.statusText}`);
  }

  return response.json();
}

interface DeleteTaskResponse {
  message: string;
  task_id: string;
}

export async function deleteTask(taskId: string): Promise<DeleteTaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete task: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleTaskComplete(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/toggle-complete/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle task completion: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleTaskRecurring(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/toggle-recurring/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle task recurring: ${response.statusText}`);
  }

  return response.json();
}

export async function toggleTaskPriority(taskId: string): Promise<TaskResponse> {
  const response = await fetch(`${BASE_URL}/tasks/toggle-priority/${taskId}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle task priority: ${response.statusText}`);
  }

  return response.json();
}

export async function clearListTasks(listId: string): Promise<TaskResponse[]> {
  const response = await fetch(`${BASE_URL}/tasks/clear-list/${listId}`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to clear list tasks: ${response.statusText}`);
  }

  return response.json();
}

export async function rolloverList(listId: string): Promise<TaskResponse[]> {
  const response = await fetch(`${BASE_URL}/tasks/rollover-list/${listId}`, {
    method: 'POST',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to rollover list: ${response.statusText}`);
  }

  return response.json();
}

export async function getCurrentListTasks(listId: string): Promise<TaskResponse[]> {
  const response = await fetch(`${BASE_URL}/tasks/list/${listId}/current`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get current list tasks: ${response.statusText}`);
  }

  return response.json();
}

export async function getListTaskVersions(
  listId: string,
  pageStart = 0,
  pageEnd = 10
): Promise<TaskResponse[][]> {
  const params = new URLSearchParams({
    page_start: pageStart.toString(),
    page_end: pageEnd.toString(),
  });

  const response = await fetch(`${BASE_URL}/tasks/list/${listId}/versions?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get list task versions: ${response.statusText}`);
  }

  return response.json();
}

export async function getTasksFromListVersion(
  listId: string,
  listRequestVersion: number
): Promise<TaskResponse[]> {
  const response = await fetch(`${BASE_URL}/tasks/list/${listId}/version/${listRequestVersion}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get tasks from list version: ${response.statusText}`);
  }

  return response.json();
}