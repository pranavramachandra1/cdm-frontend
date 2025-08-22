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
  visibility?: 'PRIVATE' | 'PUBLIC' | 'ORGANIZATION_ONLY';
}

export interface ListResponse {
  list_id: string;
  user_id: string;
  list_name: string;
  created_at: string;
  last_updated_at: string;
  version: number;
  visibility?: 'PRIVATE' | 'PUBLIC' | 'ORGANIZATION_ONLY';
  share_token?: string;
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
  console.log(`${process.env.BACKEND_BASE_URL}/lists/user/${userId}`)
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

export interface SharedListVerificationResult {
  success: boolean;
  list?: ListResponse;
  error?: {
    status: number;
    message: string;
  };
}

export async function updateListVisibility(
  listId: string, 
  visibility: 'PRIVATE' | 'PUBLIC' | 'ORGANIZATION_ONLY'
): Promise<ListResponse> {
  const response = await fetch(`/api/lists/${listId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ visibility }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update list visibility: ${response.statusText}`);
  }

  return response.json();
}

export async function verifySharedListAccess(
  shareToken: string, 
  requesterId: string
): Promise<SharedListVerificationResult> {
  try {
    const response = await fetch(`/api/lists/shared/${shareToken}/user/${requesterId}`);

    if (response.ok) {
      const list = await response.json();
      return {
        success: true,
        list: list
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          status: response.status,
          message: errorData.error || (response.status === 403 
            ? "You don't have permission to view this list"
            : response.status === 404
            ? "This list doesn't exist or the link is invalid"
            : "Unable to load list. Please try again.")
        }
      };
    }
  } catch {
    return {
      success: false,
      error: {
        status: 500,
        message: "Unable to load list. Please try again."
      }
    };
  }
}