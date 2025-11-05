'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ChatKeyProvider } from '@/context/chatkey-context';
import { ChatProvider } from '@/context/chat-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ChatKeyProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </ChatKeyProvider>
    </QueryClientProvider>
  );
}

