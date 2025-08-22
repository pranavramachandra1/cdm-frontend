'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: {
    status: number;
    message: string;
  };
  shareToken: string;
}

export default function ErrorPage({ error, shareToken }: ErrorPageProps) {
  const getErrorTitle = () => {
    switch (error.status) {
      case 403:
        return "Access Denied";
      case 404:
        return "List Not Found";
      case 401:
        return "Authentication Required";
      default:
        return "Something Went Wrong";
    }
  };

  const getErrorIcon = () => {
    switch (error.status) {
      case 403:
        return (
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 404:
        return (
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.007-5.824-2.709M15 11V9a6 6 0 10-12 0v2m6 5.99V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1m5 0V9a6 6 0 112 0v2m2 2h1a2 2 0 012 2v8a2 2 0 01-2 2h-1a2 2 0 01-2-2v-2.01" />
          </svg>
        );
      case 401:
        return (
          <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    // Always show "Go to My Dashboard" button
    buttons.push(
      <Link
        key="dashboard"
        href="/dashboard"
        className="inline-flex items-center px-4 py-2 bg-[#b8cee4] text-[#111418] text-sm font-medium rounded-xl hover:bg-[#a5c1db] transition-colors"
      >
        Go to My Dashboard
      </Link>
    );

    // For auth errors, show login button
    if (error.status === 401) {
      buttons.unshift(
        <Link
          key="login"
          href={`/login?redirect=/shared/${shareToken}`}
          className="inline-flex items-center px-4 py-2 bg-[#111418] text-white text-sm font-medium rounded-xl hover:bg-[#2a2f36] transition-colors mr-3"
        >
          Log In
        </Link>
      );
    }

    // For network errors, show retry option
    if (error.status === 500) {
      buttons.unshift(
        <button
          key="retry"
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 bg-[#111418] text-white text-sm font-medium rounded-xl hover:bg-[#2a2f36] transition-colors mr-3"
        >
          Try Again
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: 'Manrope, "Noto Sans", sans-serif' }}>
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {getErrorIcon()}
          
          <h1 className="text-2xl font-bold text-[#111418] mb-2">
            {getErrorTitle()}
          </h1>
          
          <p className="text-[#5e7387] mb-6 leading-relaxed">
            {error.message}
          </p>

          {error.status === 403 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-red-700 text-sm">
                This list may be private or you may not have the necessary permissions to view it.
              </p>
            </div>
          )}

          {error.status === 404 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
              <p className="text-gray-700 text-sm">
                The list may have been deleted or the share link may be invalid.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-center items-center gap-3">
            {getActionButtons()}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[#5e7387] text-sm">
            Need help? Contact the person who shared this list with you.
          </p>
        </div>
      </div>
    </div>
  );
}