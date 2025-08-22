import { Suspense } from 'react';
import SharedListPage from './SharedListPage';

export default function SharedTokenPage({ params }: { params: Promise<{ shareToken: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b8cee4] mx-auto mb-4"></div>
        <p className="text-[#5e7387]">Loading shared list...</p>
      </div>
    </div>}>
      <SharedListPage params={params} />
    </Suspense>
  );
}