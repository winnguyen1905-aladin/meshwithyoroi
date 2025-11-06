'use client';

import { useMemo, useRef, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useJobsInfinite } from '@/hooks/use-job';
import { socketManager } from '@/services/socket-manager';

type UseJobsSidebarResult = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  onScroll: () => void;
  jobs: any[];
  isLoading: boolean;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  currentJobId: string | undefined;
};

export const useJobsSidebar = (): UseJobsSidebarResult => {
  
  const pathname = usePathname();
  const { stakeAddress } = useAuth();
  const queryClient = useQueryClient();
  const currentJobId = pathname?.split('/job/')[1]?.split('/')[0];

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useJobsInfinite(stakeAddress || undefined);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const jobs = useMemo(() => {
    const pages = data?.pages || [];
    const list = pages.flatMap((p: any) => p?.data?.data || []);
    return list.sort((a: any, b: any) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [data]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {

    if (!stakeAddress) return;
    const client = socketManager.getSocket('/chat', {});

    const handleNewMessage = (data: any) => {
      const jobId = data?.jobId;
      if (!jobId) return;

      const bumpJobInPages = (prev: any) => {
        if (!prev?.pages) return prev;
        const pages = prev.pages.map((page: any) => ({
          ...page,
          data: { ...page.data, data: [...(page?.data?.data || [])] },
        }));
        let foundIndex = -1;
        let foundPageIdx = -1;
        for (let pi = 0; pi < pages.length; pi++) {
          const list = pages[pi].data.data;
          const idx = list.findIndex((j: any) => j.id === jobId);
          if (idx !== -1) {
            foundIndex = idx;
            foundPageIdx = pi;
            break;
          }
        }
        if (foundIndex === -1) return prev;
        const foundJob = pages[foundPageIdx].data.data[foundIndex];
        pages[foundPageIdx].data.data.splice(foundIndex, 1);
        pages[0].data.data.unshift({ ...foundJob });
        return { ...prev, pages };
      };

      queryClient.setQueryData(['jobs-infinite', stakeAddress, 10], bumpJobInPages);
    };

    client.on('contract:message.new', handleNewMessage);
    return () => {
      client.off('contract:message.new', handleNewMessage);
    };
  }, [stakeAddress, queryClient]);

  return {
    containerRef,
    onScroll,
    jobs,
    isLoading: !stakeAddress || isLoading,
    hasNextPage,
    isFetchingNextPage,
    currentJobId,
  };
};