'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
  const { stakeAddress } = useAuth();
  const previousJobIdRef = useRef<string>(jobId);
  const [isVisible, setIsVisible] = useState(false);

  // Detect job change and trigger fade animation
  useEffect(() => {
    if (previousJobIdRef.current !== jobId) {
      setIsVisible(false);
      previousJobIdRef.current = jobId;
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      // Initial mount - fade in
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [jobId]);

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

  // Memoize rendered messages to prevent re-render when unrelated parent state changes
  const renderedMessages = useMemo(() => {
    return messages.map((m, index) => {
      const isSelf = m.senderId === stakeAddress;
      // Create a unique key: prefer ID, fallback to timestamp + senderId + content hash + index for uniqueness
      // Using index as last resort ensures uniqueness even if other fields match
      const uniqueKey = m.id || `${m.timestamp}-${m.senderId}-${m.encryptedContent.substring(0, 20)}-${index}`;
      return (
        <div key={uniqueKey} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isSelf ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <div className="whitespace-pre-wrap break-words">{m.encryptedContent}</div>
            <div className={`mt-1 text-[10px] ${isSelf ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      );
    });
  }, [messages, stakeAddress]);

  return (
    <div 
      ref={listRef} 
      onScroll={handleScroll} 
      className={`flex-1 overflow-y-auto p-4 space-y-2 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[10px]'
      }`}
    >
      {renderedMessages}
    </div>
  );
};



