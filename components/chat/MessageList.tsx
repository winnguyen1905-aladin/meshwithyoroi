'use client';

import { useEffect, useRef, useMemo, useState, useLayoutEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJobMessages } from '@/store/use-chat.store';

export const MessageList = ({
  jobId,
  onLoadMore,
}: {
  jobId: string;
  onLoadMore?: () => void;
}) => {
  const { stakeAddress } = useAuth();
  const messages = useJobMessages(jobId);
  const rafRef = useRef<number | null>(null);
  const previousJobIdRef = useRef<string>(jobId);
  const [isVisible, setIsVisible] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (smooth: boolean = false) => {
    const sentinel = bottomRef.current;
    if (!sentinel) return;
    sentinel.scrollIntoView({ block: 'end', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
  };

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

  useLayoutEffect(() => {
    // Smooth scroll as soon as DOM updates with new message
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    // Fallback: ensure scroll after paint
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => scrollToBottom(true));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [messages.length]);

  // Ensure scroll to bottom after fade-in when job changes
  useEffect(() => {
    if (!isVisible) return;
    let raf1: number | null = null;
    let raf2: number | null = null;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => scrollToBottom(false));
    });
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [isVisible, jobId]);

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
      const uniqueKey = m.id || `${m.timestamp}-${m.senderId}-${m.plaintext?.substring(0, 20)}-${index}`;
      return (
        <div key={uniqueKey} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isSelf ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <div className="whitespace-pre-wrap break-words">{m.plaintext}</div>
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
      className={`flex-1 overflow-y-auto p-4 space-y-2 transition-all duration-350 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[10px]'
      }`}
    >
      {renderedMessages}
      <div ref={bottomRef} />
    </div>
  );
};