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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create list: ${response.statusText}`);
  }

  return response.json();
}

export async function getList(listId: string): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}`);

  if (!response.ok) {
    throw new Error(`Failed to get list: ${response.statusText}`);
  }

  return response.json();
}

export async function updateList(listId: string, updateData: ListUpdate): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
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
  });

  if (!response.ok) {
    throw new Error(`Failed to delete list: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserLists(userId: string): Promise<ListResponse[]> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/user/${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to get user lists: ${response.statusText}`);
  }

  return response.json();
}

export async function incrementListVersion(listId: string): Promise<ListResponse> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}/increment-version`, {
    method: 'PATCH',
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

  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to get all lists: ${response.statusText}`);
  }

  return response.json();
}

export async function getListStats(listId: string): Promise<any> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/lists/${listId}/stats`);

  if (!response.ok) {
    throw new Error(`Failed to get list stats: ${response.statusText}`);
  }

  return response.json();
}