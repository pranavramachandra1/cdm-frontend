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

export interface ListCreate {
  user_id: string;
  list_name: string;
}

export interface ListUpdate {
  list_id?: string;
  user_id?: string;
  list_name?: string;
  created_at?: string;
  last_updated_at?: string;
  version?: number;
}

export interface ListResponse {
  list_id: string;
  user_id: string;
  list_name: string;
  created_at: string;
  last_updated_at: string;
  version: number;
}

export async function createList(listData: ListCreate): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(listData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create list: ${response.statusText}`);
  }

  return response.json();
}

export async function getList(listId: string): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get list: ${response.statusText}`);
  }

  return response.json();
}

export async function updateList(listId: string, updateData: ListUpdate): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update list: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteList(listId: string): Promise<{ message: string; list_id: string }> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete list: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserLists(userId: string): Promise<ListResponse[]> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/user/${userId}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get user lists: ${response.statusText}`);
  }

  return response.json();
}

export async function incrementListVersion(listId: string): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}/increment-version`, {
    method: 'PATCH',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to increment list version: ${response.statusText}`);
  }

  return response.json();
}

export async function getAllLists(skip = 0, limit = 100, userId?: string): Promise<ListResponse[]> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  if (userId) {
    params.append('user_id', userId);
  }

  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/?${params.toString()}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get all lists: ${response.statusText}`);
  }

  return response.json();
}

interface ListStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  priority_tasks: number;
  recurring_tasks: number;
}

export async function getListStats(listId: string): Promise<ListStats> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}/stats`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get list stats: ${response.statusText}`);
  }

  return response.json();
}