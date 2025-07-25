// Remove 'use client' - this is now a Server Component

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient'; // We'll create this

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

interface User {
  id?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  google_id: string;
}

interface SessionData {
  google: GoogleUserInfo;
  user: User;
  isNewUser: boolean;
}

// Helper function to get session data
async function getSessionData(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as SessionData;
  } catch (error) {
    console.error('Failed to parse session data:', error);
    return null;
  }
}

// Server Component - handles auth and data fetching
export default async function Dashboard() {
  console.log('🚀 SERVER: Dashboard rendering');
  // Get session data from cookie
  const userSessionData = await getSessionData();
  
  // Redirect to login if no session
  if (!userSessionData) {
    redirect('/?error=no_session');
  }

  // Pass session data to client component
  return <DashboardClient userSessionData={userSessionData} />;
}