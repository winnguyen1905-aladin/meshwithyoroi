'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useCallback, useRef } from 'react';
import JobChatLayout from '@/app/job/[jobId]/JobChatLayout';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { useAuth } from '@/hooks/use-auth';
import { useJob, useJobMessagesInfinite, useMarkMessagesRead } from '@/hooks/use-job';
import { useJoinJobRoom, useLeaveJobRoom, useResolvePeerPublicKey } from '@/hooks/use-chat';
import { useJobMessages } from '@/store/use-chat.store';

export default function JobDetailPage() {
  const router = useRouter();
  const { jobId } = useParams() as { jobId: string };

  const { stakeAddress, isAuthenticated } = useAuth();
  const joinRoom = useJoinJobRoom();
  const leaveRoom = useLeaveJobRoom();

  const { data: jobResponse, isLoading, error } = useJob(jobId);
  const job = jobResponse?.data;

  const messages = useJobMessages(jobId);
  const messagesInfinite = useJobMessagesInfinite(jobId);

  useEffect(() => {
    if (!jobId) return;
    joinRoom(jobId);
    return () => leaveRoom(jobId);
  }, [jobId, joinRoom, leaveRoom]);

  const canSend = useMemo(() => {
    if (!stakeAddress || !job) return false;
    return job.aladinId === stakeAddress || job.genieId === stakeAddress;
  }, [stakeAddress, job]);

  const resolvePeerPublicKey = useResolvePeerPublicKey(jobId, job, stakeAddress || undefined);

  const handleLoadMore = useCallback(() => {
    messagesInfinite.fetchNextPage();
  }, [messagesInfinite]);

  // ---- mark read (nhẹ, tránh lặp) ----
  const markReadMutation = useMarkMessagesRead();
  const lastMarkedRef = useRef<string>('');
  useEffect(() => {
    if (!canSend || !jobId || !stakeAddress || messages.length === 0) return;
    const unread = messages.filter(m => m.senderId !== stakeAddress && !m.metadata?.read).map(m => m.id).filter(Boolean) as string[];
    if (unread.length === 0) return;
    const key = `${jobId}:${unread[0]}:${unread[unread.length-1]}:${unread.length}`;
    if (lastMarkedRef.current === key) return;
    const t = setTimeout(() => {
      lastMarkedRef.current = key;
      markReadMutation.mutate({ jobId, messageIds: unread });
    }, 600);
    return () => clearTimeout(t);
  }, [messages, messages.length, canSend, jobId, stakeAddress, markReadMutation]);
  // ------------------------------------

  const topLayerNode = useMemo(() => {
    // Ví dụ: thanh trạng thái / cảnh báo / indicator kết nối
    // if (!isAuthenticated) {
    //   return <div className="px-4 py-2 text-xs text-yellow-900 bg-yellow-50 border-b">Please connect your wallet.</div>;
    // }
    return null;
  }, [isAuthenticated, canSend]);

  const headerNode = useMemo(() => {
    if (job) return <ChatHeader key={jobId} title={job.title} status={job.status} />;
    return (
      <div className="p-4 border-b border-gray-200">
        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }, [job?.title, job?.status, jobId]);

  const listNode = useMemo(() => {
    if (messagesInfinite.isLoading && messages.length === 0) {
      return (
        <div className="p-4 space-y-2">
          <div className="flex justify-start"><div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" /></div>
          <div className="flex justify-end"><div className="h-6 w-56 bg-gray-200 rounded-lg animate-pulse" /></div>
          <div className="flex justify-start"><div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" /></div>
          <div className="flex justify-end"><div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" /></div>
        </div>
      );
    }
    return <MessageList jobId={jobId} onLoadMore={handleLoadMore} />;
  }, [messagesInfinite.isLoading, messages.length, jobId, handleLoadMore]);

  const composerNode = useMemo(() => (
    <MessageComposer
      jobId={jobId}
      resolvePeerPublicKey={resolvePeerPublicKey}
      disabled={!canSend || !isAuthenticated}
    />
  ), [jobId, resolvePeerPublicKey, canSend, isAuthenticated]);

  if (error || (!isLoading && !job)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-red-800">Job Not Found</h2>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : 'The job you are looking for does not exist'}
          </p>
          <button onClick={() => router.push('/job')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <JobChatLayout
      topLayer={topLayerNode}
      header={headerNode}
      list={listNode}
      composer={composerNode}
    />
  );
}
