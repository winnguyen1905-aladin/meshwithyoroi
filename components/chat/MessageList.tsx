'use client';

import { useEffect, useRef } from 'react';
import { useJobMessages } from '@/store/use-chat.store';

export const MessageList = ({
  jobId,
  onLoadMore,
}: {
  jobId: string;
  onLoadMore?: () => void;
}) => {

  const listRef = useRef<HTMLDivElement | null>(null);
  const messages = useJobMessages(jobId);

  useEffect(() => {
    // Auto scroll to bottom on new message
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
    
  }, [messages.length]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el || !onLoadMore) return;
    if (el.scrollTop <= 0) onLoadMore();
  };

  return (
    <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((m) => {
        const isSelf = typeof window !== 'undefined' && m.senderId === (window as any).currentWalletAddress;
        return (
          <div key={m.id || m.timestamp} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isSelf ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
              <div className={`mt-1 text-[10px] ${isSelf ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};



