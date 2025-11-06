'use client';

import Link from 'next/link';
import { useJobsSidebar } from '@/hooks/use-jobs-sidebar';

export const JobsSidebar = () => {
  
  const { containerRef, onScroll, jobs, isLoading, 
    hasNextPage, isFetchingNextPage, currentJobId, lastBumpedJobId } = useJobsSidebar();

  return (
    <div ref={containerRef} onScroll={onScroll} className="h-full overflow-y-auto border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Job Conversations</h2>
      </div>
      {isLoading && (
        <div className="p-4 text-sm text-gray-500">Loading...</div>
      )}
      <ul className="divide-y divide-gray-100">
        {jobs.map((j: any) => {
          const isActive = currentJobId === j.id;
          const isBumped = lastBumpedJobId === j.id;
          return (
            <li key={j.id}>
              <Link 
                href={`/job/${j.id}`} 
                className={`block p-4 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-l-4 border-l-blue-600 font-medium' 
                    : 'hover:bg-gray-50'
                } ${isBumped ? 'sidebar-bumped' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`truncate mr-3 ${isActive ? 'text-blue-900' : ''}`}>
                    {j.title || `Job #${j.id}`}
                  </div>
                  {j.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5">
                      {j.unreadCount}
                    </span>
                  )}
                </div>
                <div className={`mt-1 text-xs ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                  {new Date(j.updatedAt || j.createdAt).toLocaleString()}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {hasNextPage && (
        <div className="p-3 text-center text-xs text-gray-500">{isFetchingNextPage ? 'Loading more...' : 'Scroll to load more'}</div>
      )}
      <style jsx>{`
        @keyframes bumpSlideHighlight {
          0% { transform: translateY(8px); background-color: rgba(59,130,246,0.12); }
          60% { transform: translateY(0); background-color: rgba(59,130,246,0.08); }
          100% { transform: translateY(0); background-color: transparent; }
        }
        :global(.sidebar-bumped) {
          animation: bumpSlideHighlight 700ms ease-out;
        }
      `}</style>
    </div>
  );
};