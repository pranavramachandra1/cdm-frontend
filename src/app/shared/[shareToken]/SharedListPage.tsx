'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifySharedListAccess, type SharedListVerificationResult } from '@/lib/lists';
import SharedListClient from './SharedListClient';
import ErrorPage from './ErrorPage';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

interface User {
  user_id?: string;
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

interface SharedListPageProps {
  params: Promise<{ shareToken: string }>;
}

export default function SharedListPage({ params }: SharedListPageProps) {
  const [shareToken, setShareToken] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<SharedListVerificationResult | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Get session data from cookie
  const getSessionData = (): SessionData | null => {
    try {
      const cookies = document.cookie
        .split(';')
        .find(cookie => cookie.trim().startsWith('user_session='));
      
      if (!cookies) {
        return null;
      }

      const sessionValue = cookies.split('=')[1];
      if (!sessionValue) {
        return null;
      }

      return JSON.parse(decodeURIComponent(sessionValue)) as SessionData;
    } catch (error) {
      console.error('Failed to parse session data:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Get the share token from params
        const resolvedParams = await params;
        setShareToken(resolvedParams.shareToken);

        // Get session data
        const session = getSessionData();
        if (!session) {
          // Redirect to login with return URL
          router.push(`/login?redirect=/shared/${resolvedParams.shareToken}`);
          return;
        }
        
        setSessionData(session);

        // Get user ID for verification
        const userId = session.user.user_id || session.user.google_id;
        if (!userId) {
          setVerificationResult({
            success: false,
            error: {
              status: 401,
              message: "Authentication required. Please log in to view this list."
            }
          });
          setIsLoading(false);
          return;
        }

        // Verify access to the shared list
        const result = await verifySharedListAccess(resolvedParams.shareToken, userId);
        setVerificationResult(result);
      } catch (error) {
        console.error('Error initializing shared list page:', error);
        setVerificationResult({
          success: false,
          error: {
            status: 500,
            message: "Unable to load list. Please try again."
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [params, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50" style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b8cee4] mx-auto mb-4"></div>
          <p className="text-[#5e7387]">Verifying access to shared list...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!verificationResult?.success || !sessionData) {
    return (
      <ErrorPage 
        error={verificationResult?.error || { status: 500, message: "Unable to load list" }}
        shareToken={shareToken}
      />
    );
  }

  // Success state - show the shared list
  return (
    <SharedListClient 
      sharedList={verificationResult.list!}
      userSessionData={sessionData}
      shareToken={shareToken}
    />
  );
}