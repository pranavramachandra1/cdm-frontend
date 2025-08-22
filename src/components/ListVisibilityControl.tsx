'use client';

import { useState, useEffect, useRef } from 'react';
import { updateListVisibility, type ListResponse } from '@/lib/lists';

interface ListVisibilityControlProps {
  list: ListResponse;
  onVisibilityUpdate: (updatedList: ListResponse) => void;
}

export default function ListVisibilityControl({ list, onVisibilityUpdate }: ListVisibilityControlProps) {
  const [showForm, setShowForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowForm(false);
      }
    };

    if (showForm) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showForm]);
  
  const visibilityOptions = [
    {
      value: 'PRIVATE' as const,
      label: 'Private',
      description: 'Only you can access this list',
      icon: '🔒'
    },
    {
      value: 'PUBLIC' as const,
      label: 'Public',
      description: 'Anyone with the link can access this list',
      icon: '🌐'
    },
    {
      value: 'ORGANIZATION_ONLY' as const,
      label: 'Organization Only',
      description: 'Only people with your email domain can access this list',
      icon: '🏢'
    }
  ];

  const currentVisibility = list.visibility || 'PRIVATE';
  const currentOption = visibilityOptions.find(opt => opt.value === currentVisibility);
  const isPrivate = currentVisibility === 'PRIVATE';

  const handleVisibilityUpdate = async (newVisibility: 'PRIVATE' | 'PUBLIC' | 'ORGANIZATION_ONLY') => {
    if (newVisibility === currentVisibility) {
      setShowForm(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedList = await updateListVisibility(list.list_id, newVisibility);
      onVisibilityUpdate(updatedList);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update list visibility:', error);
      // Could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const getShareUrl = () => {
    if (typeof window !== 'undefined' && list.share_token) {
      return `${window.location.origin}/shared/${list.share_token}`;
    }
    return '';
  };

  const copyShareUrl = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Visibility Toggle Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#111418] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[36px]"
          title="Change list visibility"
        >
          <span>{currentOption?.icon}</span>
          <span>{currentOption?.label}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Share URL Button - Only show if not private */}
        {!isPrivate && list.share_token && (
          <button
            onClick={copyShareUrl}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#111418] bg-[#b8cee4] hover:bg-[#a5c1db] rounded-lg transition-colors min-h-[36px]"
            title="Copy share link"
          >
            {copiedToClipboard ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Visibility Form Modal */}
      {showForm && (
        <div ref={modalRef} className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[320px]">
          <div className="mb-3">
            <h3 className="text-[#111418] text-base font-semibold mb-1">List Visibility</h3>
            <p className="text-[#5e7387] text-sm">Control who can access this list</p>
          </div>

          <div className="space-y-2">
            {visibilityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleVisibilityUpdate(option.value)}
                disabled={isUpdating}
                className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentVisibility === option.value ? 'bg-[#b8cee4] hover:bg-[#a5c1db]' : ''
                }`}
              >
                <span className="text-lg mt-0.5">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[#111418] text-sm ${currentVisibility === option.value ? 'font-bold' : 'font-medium'}`}>
                      {option.label}
                    </span>
                    {currentVisibility === option.value && (
                      <svg className="w-4 h-4 text-[#111418]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[#5e7387] text-xs mt-1">{option.description}</p>
                </div>
              </button>
            ))}
          </div>

          {isUpdating && (
            <div className="mt-3 flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#b8cee4]"></div>
              <span className="ml-2 text-[#5e7387] text-sm">Updating...</span>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowForm(false)}
              className="w-full px-3 py-2 text-sm font-medium text-[#5e7387] hover:text-[#111418] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}