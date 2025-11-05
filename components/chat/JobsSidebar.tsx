'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useConversations } from '@/hooks/use-job';

export const JobsSidebar = () => {
  const { wallet } = useAuth();
  const address = wallet?.address;
  const { data, isLoading } = useConversations(address);

  return (
    <div className="h-full overflow-y-auto border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Conversations</h2>
      </div>
      {isLoading && (
        <div className="p-4 text-sm text-gray-500">Loading...</div>
      )}
      <ul className="divide-y divide-gray-100">
        {data?.data?.sort((a, b) => (new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())).map((c) => {
          const preview = (c as any).lastMessage || '';
          return (
            <li key={c.jobId}>
              <Link href={`/jobs/${c.jobId}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate mr-3">{c.title || `Job #${c.jobId}`}</div>
                  {c.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs px-2 py-0.5">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-500 truncate">
                  {preview || 'Encrypted message'}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {new Date(c.lastMessageAt).toLocaleString()}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};


