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

export interface UserCreate {
  username: string
  email: string
  password: string
  phone_number: string
  first_name: string
  last_name: string
  google_id: string
}

export interface UserUpdate {
  username?: string
  email?: string
  password?: string
  phone_number?: string
  first_name?: string
  last_name?: string
  google_id?: string
}

export async function createUser(userData: UserCreate): Promise<any> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export async function getUser(user_id: string): Promise<any> {
    const response = await fetch(`${process.env.BACKEND_BASE_URL}/users/${user_id}`, {
        method: 'GET',
        headers: getHeaders(),
        // No body needed for GET requests
        });
    
    // console.log(response)


  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} error message: ${response.statusText}`);
  }

  return await response.json();
}

export async function getUserWithGoogleID(google_id: string): Promise<any> {
    const response = await fetch(`${process.env.BACKEND_BASE_URL}/users/google-id/${google_id}`, {
        method: 'GET',
        headers: getHeaders(),
        // No body needed for GET requests
        });

    // console.log(response)

    console.log(response)

    if (!response.ok) {
        return null
    }

    return await response.json();
}

export async function deleteUser(user_id: string): Promise<any> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/users/${user_id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    // No body needed for DELETE requests
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export async function updateUser(user_id: string, userData: UserUpdate): Promise<any> {
  const response = await fetch(`${process.env.BACKEND_BASE_URL}/users/${user_id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}